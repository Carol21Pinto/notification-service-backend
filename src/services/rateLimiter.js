const redis = require("../redis/redisClient");

const LIMIT = 5;
const WINDOW = 60;

async function checkRateLimit(userId) {

  const key = `rate_limit:${userId}`;

  const count = await redis.incr(key);


  if (count === 1) {
    await redis.expire(key, WINDOW);
  }

  if (count > LIMIT) {
    return false;
  }

  return true;
}

module.exports = checkRateLimit;