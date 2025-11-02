const BaseRepository = require('./base.repository');
const Integration = require('../models/integration.model');

class IntegrationRepository extends BaseRepository {
  constructor() {
    super(Integration);
  }

  /**
   * Find an active integration by user ID
   * @param {string} userId - GitHub user ID
   * @returns {Promise<Object>} Integration document
   */
  async findActiveByUserId(userId) {
    return await this.model.findActiveByUserId(userId);
  }

  /**
   * Find or create an integration
   * @param {Object} userData - User data from GitHub
   * @returns {Promise<Object>} Integration document
   */
  async findOrCreate(userData) {
    return await this.model.findOrCreate(userData);
  }

  /**
   * Update integration tokens
   * @param {string} userId - GitHub user ID
   * @param {Object} tokens - Access and refresh tokens
   * @returns {Promise<Object>} Updated integration
   */
  async updateTokens(userId, tokens) {
    return await this.updateOne(
      { userId },
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: tokens.tokenType || 'Bearer',
        scope: tokens.scope,
      }
    );
  }

  /**
   * Update sync status
   * @param {string} userId - GitHub user ID
   * @param {string} status - Sync status
   * @param {Object} progress - Progress info
   * @returns {Promise<Object>} Updated integration
   */
  async updateSyncStatus(userId, status, progress = null) {
    const update = { syncStatus: status };

    if (progress) {
      update.syncProgress = progress;
    }

    if (status === 'completed') {
      update.lastSyncAt = new Date();
    }

    return await this.updateOne({ userId }, update);
  }

  /**
   * Update rate limit info
   * @param {string} userId - GitHub user ID
   * @param {Object} rateLimitInfo - Rate limit information
   * @returns {Promise<Object>} Updated integration
   */
  async updateRateLimit(userId, rateLimitInfo) {
    return await this.updateOne(
      { userId },
      {
        rateLimitInfo: {
          limit: rateLimitInfo.limit,
          remaining: rateLimitInfo.remaining,
          reset: new Date(rateLimitInfo.reset * 1000),
          used: rateLimitInfo.used,
        },
      }
    );
  }

  /**
   * Update integration metadata
   * @param {string} userId - GitHub user ID
   * @param {Object} metadata - Metadata to update
   * @returns {Promise<Object>} Updated integration
   */
  async updateMetadata(userId, metadata) {
    const integration = await this.findOne({ userId });
    if (!integration) {
      throw new Error('Integration not found');
    }

    Object.assign(integration.metadata, metadata);
    return await integration.save();
  }

  /**
   * Deactivate an integration
   * @param {string} userId - GitHub user ID
   * @returns {Promise<Object>} Updated integration
   */
  async deactivate(userId) {
    const integration = await this.findOne({ userId });
    if (!integration) {
      throw new Error('Integration not found');
    }

    return await integration.deactivate();
  }

  /**
   * Get all active integrations
   * @returns {Promise<Array>} Array of active integrations
   */
  async findAllActive() {
    return await this.find({ isActive: true });
  }

  /**
   * Get integrations that need sync
   * @returns {Promise<Array>} Array of integrations needing sync
   */
  async findIntegrationsNeedingSync() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await this.find({
      isActive: true,
      $or: [
        { lastSyncAt: null },
        { lastSyncAt: { $lt: oneDayAgo } },
      ],
    });
  }

  /**
   * Get integration statistics
   * @param {string} userId - GitHub user ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(userId) {
    const integration = await this.findOne({ userId });
    if (!integration) {
      throw new Error('Integration not found');
    }

    return {
      connectedAt: integration.connectedAt,
      lastSyncAt: integration.lastSyncAt,
      totalRepos: integration.metadata.totalRepos || 0,
      totalCommits: integration.metadata.totalCommits || 0,
      totalIssues: integration.metadata.totalIssues || 0,
      totalPulls: integration.metadata.totalPulls || 0,
      totalUsers: integration.metadata.totalUsers || 0,
      organizations: integration.metadata.organizations || [],
      syncStatus: integration.syncStatus,
      needsSync: integration.needsSync,
    };
  }

  /**
   * Check if user has active integration
   * @param {string} userId - GitHub user ID
   * @returns {Promise<boolean>} True if active integration exists
   */
  async hasActiveIntegration(userId) {
    const integration = await this.findActiveByUserId(userId);
    return !!integration;
  }

  /**
   * Get decrypted tokens
   * @param {string} userId - GitHub user ID
   * @returns {Promise<Object>} Decrypted tokens
   */
  async getDecryptedTokens(userId) {
    const integration = await this.findActiveByUserId(userId);
    if (!integration) {
      throw new Error('No active integration found');
    }

    return {
      accessToken: integration.getDecryptedAccessToken(),
      refreshToken: integration.getDecryptedRefreshToken(),
      tokenType: integration.tokenType,
      scope: integration.scope,
    };
  }
}

module.exports = new IntegrationRepository();