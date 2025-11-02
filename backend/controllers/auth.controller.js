const integrationService = require('../services/integration.service');
const ResponseHelper = require('../helpers/response.helper');
const { AppError } = require('../helpers/error.helper');
const githubConfig = require('../config/github.config');
const config = require('../config/environment');
const jwt = require('jsonwebtoken');
const cryptoHelper = require('../helpers/crypto.helper');

class AuthController {
  /**
   * Initiate GitHub OAuth flow
   * GET /api/auth/github
   */
  async initiateGitHubAuth(req, res, next) {
    try {
      // Generate state for CSRF protection
      const state = cryptoHelper.generateToken(32);

      // Store state in session or temporary storage (implement based on your needs)
      req.session = req.session || {};
      req.session.oauthState = state;

      // Build GitHub OAuth URL
      const params = new URLSearchParams({
        client_id: githubConfig.clientID,
        redirect_uri: githubConfig.callbackURL,
        scope: githubConfig.scope.join(' '),
        state,
        allow_signup: 'true',
      });

      const authUrl = `${githubConfig.oauth.authorizeURL}?${params.toString()}`;

      // Return the URL for frontend to redirect
      ResponseHelper.success(res, { authUrl }, 'GitHub OAuth URL generated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle GitHub OAuth callback
   * GET /api/auth/github/callback
   */
  async handleGitHubCallback(req, res, next) {
    try {
      const { code, state } = req.query;

      if (!code) {
        throw new AppError('Authorization code not provided', 400);
      }

      // Verify state for CSRF protection (if implementing session)
      // if (req.session?.oauthState !== state) {
      //   throw new AppError('Invalid state parameter', 400);
      // }

      // Exchange code for access token
      const tokenData = await integrationService.exchangeCodeForToken(code);

      if (!tokenData.access_token) {
        throw new AppError('Failed to obtain access token', 400);
      }

      // Get user profile from GitHub
      const profile = await integrationService.getUserProfile(tokenData.access_token);

      // Create or update integration
      const integration = await integrationService.createOrUpdateIntegration(
        profile,
        tokenData.access_token,
        tokenData.refresh_token
      );

      // Generate JWT for session management
      const jwtToken = jwt.sign(
        {
          userId: integration.userId,
          username: integration.username,
          email: integration.email,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Redirect to frontend with token
      const redirectUrl = `${config.frontend.url}/auth/success?token=${jwtToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('GitHub callback error:', error);

      // Redirect to frontend with error
      const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
      const redirectUrl = `${config.frontend.url}/auth/error?message=${errorMessage}`;
      res.redirect(redirectUrl);
    }
  }

  /**
   * Get integration status
   * GET /api/auth/status
   */
  async getIntegrationStatus(req, res, next) {
    try {
      // Get user ID from JWT token (requires auth middleware)
      const userId = req.user?.userId || req.query.userId;

      if (!userId) {
        return ResponseHelper.success(res, {
          connected: false,
          message: 'No user ID provided',
        });
      }

      const status = await integrationService.getIntegrationStatus(userId);
      ResponseHelper.success(res, status, 'Integration status retrieved');
    } catch (error) {
      if (error.statusCode === 404) {
        return ResponseHelper.success(res, {
          connected: false,
          message: 'No active integration found',
        });
      }
      next(error);
    }
  }

  /**
   * Remove GitHub integration
   * DELETE /api/auth/disconnect
   */
  async disconnectGitHub(req, res, next) {
    try {
      const userId = req.user?.userId || req.body.userId;

      if (!userId) {
        throw new AppError('User ID not provided', 400);
      }

      const result = await integrationService.removeIntegration(userId);
      ResponseHelper.success(res, result, 'Integration removed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh integration data
   * POST /api/auth/refresh
   */
  async refreshIntegration(req, res, next) {
    try {
      const userId = req.user?.userId || req.body.userId;

      if (!userId) {
        throw new AppError('User ID not provided', 400);
      }

      const integration = await integrationService.getIntegrationByUserId(userId);

      // Verify token is still valid
      const accessToken = integration.getDecryptedAccessToken();
      const isValid = await integrationService.verifyToken(accessToken);

      if (!isValid) {
        throw new AppError('GitHub token is no longer valid. Please reconnect.', 401);
      }

      ResponseHelper.success(res, {
        valid: true,
        username: integration.username,
        connectedAt: integration.connectedAt,
        lastSyncAt: integration.lastSyncAt,
      }, 'Integration is valid');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify JWT token
   * GET /api/auth/verify
   */
  async verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        throw new AppError('No token provided', 401);
      }

      const decoded = jwt.verify(token, config.jwt.secret);

      // Check if integration is still active
      const hasIntegration = await integrationService.hasActiveIntegration(decoded.userId);

      ResponseHelper.success(res, {
        valid: true,
        user: {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
        },
        hasActiveIntegration: hasIntegration,
      }, 'Token is valid');
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return ResponseHelper.unauthorized(res, 'Invalid or expired token');
      }
      next(error);
    }
  }

  /**
   * Get user info from token
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const integration = await integrationService.getIntegrationByUserId(userId);

      ResponseHelper.success(res, {
        userId: integration.userId,
        username: integration.username,
        email: integration.email,
        name: integration.name,
        avatarUrl: integration.avatarUrl,
        profileUrl: integration.profileUrl,
        connectedAt: integration.connectedAt,
        lastSyncAt: integration.lastSyncAt,
        syncStatus: integration.syncStatus,
        metadata: integration.metadata,
      }, 'User information retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get integration statistics
   * GET /api/auth/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const userId = req.user?.userId || req.query.userId;

      if (!userId) {
        throw new AppError('User ID not provided', 400);
      }

      const stats = await integrationService.getStatistics(userId);
      ResponseHelper.success(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();