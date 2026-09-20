const rawUri = process.env.REDIS_URI || process.env.REDIS_URL;
const redisUri = rawUri ? rawUri.trim().replace(/^['"]|['"]$/g, "") : null;

let redisClient = null;
let isRedisConnected = false;

const isValidRedisUrl = redisUri && (redisUri.startsWith("redis://") || redisUri.startsWith("rediss://"));

if (isValidRedisUrl) {
  try {
    const Redis = require("ioredis");
    redisClient = new Redis(redisUri, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      commandTimeout: 1500,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 5) {
          console.warn("⚠️ Redis: max reconnection attempts reached. Disabling reconnect loop.");
          return null;
        }
        return Math.min(times * 300, 2000);
      },
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
      console.log("✅ Redis connected successfully");
    });

    redisClient.on("ready", () => {
      isRedisConnected = true;
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      console.warn("⚠️ Redis connection issue (falling back to MongoDB):", err.message);
    });

    redisClient.on("close", () => {
      isRedisConnected = false;
    });

    redisClient.connect().catch((err) => {
      isRedisConnected = false;
      console.warn("⚠️ Redis initial connect skipped (falling back to MongoDB):", err.message);
    });
  } catch (err) {
    console.warn("⚠️ Redis client initialization skipped:", err.message);
    redisClient = null;
  }
} else {
  console.log("ℹ️ No active REDIS_URI configured. App running with direct MongoDB queries (cache disabled).");
}

module.exports = {
  redisClient,
  isReady: () => isRedisConnected && redisClient !== null && redisClient.status === "ready",
};
