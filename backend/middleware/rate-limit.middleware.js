const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const { redisConfig } = require('../config/redis.config');
const { AppError } = require('../helpers/error.helper');

// Create Redis client for rate limiting
const redisClient = new Redis(redisConfig);

/**
 * General API rate limiter
 */
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:general:',
  }),
  handler: (req, res) => {
    throw new AppError(
      'Too many requests, please try again later.',
      429
    );
  },
});

/**
 * Strict rate limiter for sync operations
 */
const syncRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each user to 10 sync requests per hour
  message: 'Too many sync requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID or integration ID as key
    return req.user?.userId || req.body?.integrationId || req.ip;
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:sync:',
  }),
  handler: (req, res) => {
    throw new AppError(
      'Too many sync requests. You can only sync 10 times per hour.',
      429
    );
  },
});

/**
 * Auth rate limiter for login attempts
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
  }),
  handler: (req, res) => {
    throw new AppError(
      'Too many authentication attempts, please try again in 15 minutes.',
      429
    );
  },
});

/**
 * Custom rate limiter middleware with user-based tracking
 */
const userBasedRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 60 * 1000, // 1 hour
    max = 50,
    message = 'Rate limit exceeded',
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Prefer user ID, fall back to IP
      return req.user?.userId || req.ip;
    },
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:user:',
    }),
    handler: (req, res) => {
      throw new AppError(message, 429);
    },
  });
};

/**
 * GitHub API rate limit tracking middleware
 */
const trackGitHubRateLimit = async (req, res, next) => {
  try {
    const integrationId = req.body?.integrationId || req.params?.integrationId;

    if (!integrationId) {
      return next();
    }

    // Check if integration is rate limited
    const key = `github:ratelimit:${integrationId}`;
    const rateLimitData = await redisClient.get(key);

    if (rateLimitData) {
      const { remaining, reset } = JSON.parse(rateLimitData);
      const now = Math.floor(Date.now() / 1000);

      // If rate limit exceeded and not yet reset
      if (remaining <= 0 && reset > now) {
        const resetDate = new Date(reset * 1000);
        throw new AppError(
          `GitHub API rate limit exceeded. Resets at ${resetDate.toISOString()}`,
          429
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Update GitHub API rate limit info in Redis
 */
const updateGitHubRateLimit = async (integrationId, rateLimit) => {
  try {
    const key = `github:ratelimit:${integrationId}`;
    const ttl = rateLimit.reset - Math.floor(Date.now() / 1000);

    await redisClient.setex(
      key,
      Math.max(ttl, 60), // At least 60 seconds
      JSON.stringify({
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
        used: rateLimit.used,
      })
    );
  } catch (error) {
    console.error('Failed to update GitHub rate limit:', error);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redisClient.quit();
});

module.exports = {
  generalRateLimiter,
  syncRateLimiter,
  authRateLimiter,
  userBasedRateLimiter,
  trackGitHubRateLimit,
  updateGitHubRateLimit,
  redisClient,
};
