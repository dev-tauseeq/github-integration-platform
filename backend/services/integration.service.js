const axios = require('axios');
const integrationRepository = require('../repositories/integration.repository');
const { AppError } = require('../helpers/error.helper');
const githubConfig = require('../config/github.config');

class IntegrationService {
  /**
   * Create or update integration from OAuth callback
   * @param {Object} profile - GitHub profile from OAuth
   * @param {string} accessToken - GitHub access token
   * @param {string} refreshToken - GitHub refresh token
   * @returns {Promise<Object>} Created/updated integration
   */
  async createOrUpdateIntegration(profile, accessToken, refreshToken = null) {
    try {
      const userData = {
        userId: profile.id.toString(),
        username: profile.username || profile.login,
        email: profile.emails?.[0]?.value || null,
        name: profile.displayName || profile.name || null,
        avatarUrl: profile.photos?.[0]?.value || profile.avatar_url || null,
        profileUrl: profile.profileUrl || profile.html_url || null,
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        scope: profile.scope || githubConfig.scope.join(' '),
        connectedAt: new Date(),
        isActive: true,
      };

      const integration = await integrationRepository.findOrCreate(userData);
      return integration;
    } catch (error) {
      console.error('Error creating/updating integration:', error);
      throw new AppError('Failed to save integration', 500);
    }
  }

  /**
   * Get integration by user ID
   * @param {string} userId - GitHub user ID
   * @returns {Promise<Object>} Integration document
   */
  async getIntegrationByUserId(userId) {
    const integration = await integrationRepository.findActiveByUserId(userId);
    if (!integration) {
      throw new AppError('Integration not found', 404);
    }
    return integration;
  }

  /**
   * Get integration status
   * @param {string} userId - GitHub user ID
   * @returns {Promise<Object>} Integration status
   */
  async getIntegrationStatus(userId) {
    try {
      const integration = await integrationRepository.findActiveByUserId(userId);

      if (!integration) {
        return {
          connected: false,
          message: 'No active GitHub integration found',
        };
      }

      // Verify the token is still valid
      const isValid = await this.verifyToken(integration.getDecryptedAccessToken());

      if (!isValid) {
        // Token is invalid, deactivate integration
        await integrationRepository.deactivate(userId);
        return {
          connected: false,
          message: 'GitHub token is no longer valid. Please reconnect.',
        };
      }

      return {
        connected: true,
        username: integration.username,
        email: integration.email,
        name: integration.name,
        avatarUrl: integration.avatarUrl,
        connectedAt: integration.connectedAt,
        lastSyncAt: integration.lastSyncAt,
        syncStatus: integration.syncStatus,
        needsSync: integration.needsSync,
        metadata: {
          totalRepos: integration.metadata.totalRepos || 0,
          totalCommits: integration.metadata.totalCommits || 0,
          totalIssues: integration.metadata.totalIssues || 0,
          totalPulls: integration.metadata.totalPulls || 0,
          organizations: integration.metadata.organizations || [],
        },
        rateLimitInfo: integration.rateLimitInfo,
      };
    } catch (error) {
      console.error('Error getting integration status:', error);
      throw new AppError('Failed to get integration status', 500);
    }
  }

  /**
   * Verify GitHub access token
   * @param {string} token - Access token to verify
   * @returns {Promise<boolean>} True if valid
   */
  async verifyToken(token) {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      });

      return response.status === 200;
    } catch (error) {
      if (error.response?.status === 401) {
        return false;
      }
      console.error('Error verifying token:', error.message);
      return false;
    }
  }

  /**
   * Remove integration
   * @param {string} userId - GitHub user ID
   * @returns {Promise<Object>} Result
   */
  async removeIntegration(userId) {
    try {
      const integration = await integrationRepository.findActiveByUserId(userId);

      if (!integration) {
        throw new AppError('No active integration found', 404);
      }

      await integrationRepository.deactivate(userId);

      return {
        success: true,
        message: 'GitHub integration removed successfully',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error removing integration:', error);
      throw new AppError('Failed to remove integration', 500);
    }
  }

  /**
   * Get all active integrations
   * @returns {Promise<Array>} List of active integrations
   */
  async getAllActiveIntegrations() {
    return await integrationRepository.findAllActive();
  }

  /**
   * Get integrations needing sync
   * @returns {Promise<Array>} List of integrations needing sync
   */
  async getIntegrationsNeedingSync() {
    return await integrationRepository.findIntegrationsNeedingSync();
  }

  /**
   * Update sync status
   * @param {string} userId - GitHub user ID
   * @param {string} status - New status
   * @param {Object} progress - Progress info
   * @returns {Promise<Object>} Updated integration
   */
  async updateSyncStatus(userId, status, progress = null) {
    return await integrationRepository.updateSyncStatus(userId, status, progress);
  }

  /**
   * Update rate limit info
   * @param {string} userId - GitHub user ID
   * @param {Object} headers - Response headers from GitHub API
   * @returns {Promise<Object>} Updated integration
   */
  async updateRateLimitFromHeaders(userId, headers) {
    const rateLimitInfo = {
      limit: parseInt(headers['x-ratelimit-limit']) || 5000,
      remaining: parseInt(headers['x-ratelimit-remaining']) || 5000,
      reset: parseInt(headers['x-ratelimit-reset']) || null,
      used: parseInt(headers['x-ratelimit-used']) || 0,
    };

    return await integrationRepository.updateRateLimit(userId, rateLimitInfo);
  }

  /**
   * Get integration statistics
   * @param {string} userId - GitHub user ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(userId) {
    return await integrationRepository.getStatistics(userId);
  }

  /**
   * Check if user has active integration
   * @param {string} userId - GitHub user ID
   * @returns {Promise<boolean>} True if active integration exists
   */
  async hasActiveIntegration(userId) {
    return await integrationRepository.hasActiveIntegration(userId);
  }

  /**
   * Get decrypted tokens for API calls
   * @param {string} userId - GitHub user ID
   * @returns {Promise<Object>} Decrypted tokens
   */
  async getTokensForUser(userId) {
    return await integrationRepository.getDecryptedTokens(userId);
  }

  /**
   * Exchange code for access token (OAuth flow)
   * @param {string} code - Authorization code from GitHub
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: githubConfig.clientID,
          client_secret: githubConfig.clientSecret,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (response.data.error) {
        throw new AppError(response.data.error_description || 'Failed to exchange code', 400);
      }

      return response.data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error exchanging code for token:', error);
      throw new AppError('Failed to exchange authorization code', 500);
    }
  }

  /**
   * Get user profile from GitHub
   * @param {string} accessToken - GitHub access token
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new AppError('Failed to fetch user profile from GitHub', 500);
    }
  }
}

module.exports = new IntegrationService();