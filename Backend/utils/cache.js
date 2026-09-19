const { redisClient, isReady } = require("../config/redis");

exports.getOrSetCache = async (key, ttlSeconds, fetchFn) => {

  if (isReady()) {
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn(`[Cache] Read error for key "${key}":`, err.message);
    }
  }

  const freshData = await fetchFn();

  if (freshData !== undefined && freshData !== null && isReady()) {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(freshData));
    } catch (err) {
      console.warn(`[Cache] Write error for key "${key}":`, err.message);
    }
  }

  return freshData;
};

exports.deleteCache = async (key) => {
  if (!isReady() || !key) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.warn(`[Cache] Delete error for key "${key}":`, err.message);
  }
};

exports.invalidateCachePattern = async (pattern) => {
  if (!isReady() || !pattern) return;

  try {
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100,
    });

    stream.on("data", async (keys) => {
      if (keys.length > 0) {
        stream.pause();
        try {
          await redisClient.del(...keys);
        } catch (delErr) {
          console.warn(`[Cache] Pattern del error for pattern "${pattern}":`, delErr.message);
        } finally {
          stream.resume();
        }
      }
    });

    stream.on("error", (err) => {
      console.warn(`[Cache] Scan error for pattern "${pattern}":`, err.message);
    });
  } catch (err) {
    console.warn(`[Cache] Invalidate pattern failed for "${pattern}":`, err.message);
  }
};
