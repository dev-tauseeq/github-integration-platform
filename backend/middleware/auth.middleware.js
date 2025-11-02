const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const { AppError } = require('../helpers/error.helper');
const integrationService = require('../services/integration.service');

/**
 * Verify JWT token middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : req.query.token;

    if (!token) {
      throw new AppError('Access token not provided', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired', 401));
    }
    next(error);
  }
};

/**
 * Verify if user has active GitHub integration
 */
const requireIntegration = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const hasIntegration = await integrationService.hasActiveIntegration(userId);

    if (!hasIntegration) {
      throw new AppError('No active GitHub integration found. Please connect your GitHub account.', 403);
    }

    // Get integration and add to request
    const integration = await integrationService.getIntegrationByUserId(userId);
    req.integration = integration;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : req.query.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
        };
      } catch (error) {
        // Token is invalid but we don't fail the request
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userData) => {
  return jwt.sign(
    {
      userId: userData.userId,
      username: userData.username,
      email: userData.email,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Extract user ID from various sources
 */
const extractUserId = (req) => {
  // Try to get from authenticated user
  if (req.user?.userId) {
    return req.user.userId;
  }

  // Try to get from body
  if (req.body?.userId) {
    return req.body.userId;
  }

  // Try to get from query params
  if (req.query?.userId) {
    return req.query.userId;
  }

  // Try to get from params
  if (req.params?.userId) {
    return req.params.userId;
  }

  return null;
};

/**
 * Validate API key (for server-to-server communication)
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(new AppError('API key not provided', 401));
  }

  // In production, validate against stored API keys
  const validApiKey = config.apiKey || 'your-api-key-here';

  if (apiKey !== validApiKey) {
    return next(new AppError('Invalid API key', 401));
  }

  next();
};

/**
 * Rate limiting per user
 */
const userRateLimit = (req, res, next) => {
  // This is a placeholder - in production, implement proper per-user rate limiting
  // using Redis or similar storage
  const userId = req.user?.userId || req.ip;

  // For now, just pass through
  next();
};

module.exports = {
  verifyToken,
  requireIntegration,
  optionalAuth,
  generateToken,
  extractUserId,
  validateApiKey,
  userRateLimit,
};