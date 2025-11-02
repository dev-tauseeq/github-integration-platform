const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { asyncHandler } = require('../middleware/error.middleware');
const { verifyToken, optionalAuth, requireIntegration } = require('../middleware/auth.middleware');
const { body, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Public routes

/**
 * @route   GET /api/auth/github
 * @desc    Initiate GitHub OAuth flow
 * @access  Public
 */
router.get('/github', asyncHandler(authController.initiateGitHubAuth));

/**
 * @route   GET /api/auth/github/callback
 * @desc    Handle GitHub OAuth callback
 * @access  Public
 */
router.get(
  '/github/callback',
  [
    query('code').notEmpty().withMessage('Authorization code is required'),
    validate,
  ],
  asyncHandler(authController.handleGitHubCallback)
);

/**
 * @route   GET /api/auth/status
 * @desc    Get integration status (can be called without auth)
 * @access  Public (optional auth)
 */
router.get(
  '/status',
  optionalAuth,
  asyncHandler(authController.getIntegrationStatus)
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Public
 */
router.get('/verify', asyncHandler(authController.verifyToken));

// Protected routes (require authentication)

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get(
  '/me',
  verifyToken,
  requireIntegration,
  asyncHandler(authController.getCurrentUser)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh integration data
 * @access  Private
 */
router.post(
  '/refresh',
  verifyToken,
  requireIntegration,
  asyncHandler(authController.refreshIntegration)
);

/**
 * @route   DELETE /api/auth/disconnect
 * @desc    Remove GitHub integration
 * @access  Private
 */
router.delete(
  '/disconnect',
  verifyToken,
  asyncHandler(authController.disconnectGitHub)
);

/**
 * @route   GET /api/auth/statistics
 * @desc    Get integration statistics
 * @access  Private
 */
router.get(
  '/statistics',
  verifyToken,
  requireIntegration,
  asyncHandler(authController.getStatistics)
);

// Export router
module.exports = router;