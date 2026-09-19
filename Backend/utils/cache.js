const { redisClient, isReady } = require("../config/redis");

/**
 * Cache-Aside Helper:
 * Attempts to fetch data from Redis. If missing or if Redis is offline,
 * runs the fallback fetchFn(), caches the result in Redis, and returns it.
 *
 * @param {string} key - Redis key (e.g., 'doctors:list:...')
 * @param {number} ttlSeconds - Time-To-Live in seconds (e.g., 600 for 10 minutes)
 * @param {Function} fetchFn - Async function returning fresh MongoDB data on cache miss
 * @returns {Promise<any>}
 */
exports.getOrSetCache = async (key, ttlSeconds, fetchFn) => {
  // 1. Try fetching from Redis cache if available
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

  // 2. Cache miss or Redis offline: Fetch fresh data from MongoDB
  const freshData = await fetchFn();

  // 3. Store fresh data in Redis with TTL for future requests
  if (freshData !== undefined && freshData !== null && isReady()) {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(freshData));
    } catch (err) {
      console.warn(`[Cache] Write error for key "${key}":`, err.message);
    }
  }

  return freshData;
};

/**
 * Delete a specific key from Redis
 * @param {string} key
 */
exports.deleteCache = async (key) => {
  if (!isReady() || !key) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.warn(`[Cache] Delete error for key "${key}":`, err.message);
  }
};

/**
 * Non-blocking pattern invalidation using Redis SCAN stream (safe for production)
 * @param {string} pattern - Key pattern to delete (e.g., 'doctors:*')
 */
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
