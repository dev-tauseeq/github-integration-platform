const Commit = require('../models/commit.model');
const Pull = require('../models/pull.model');
const Issue = require('../models/issue.model');
const Changelog = require('../models/changelog.model');
const User = require('../models/user.model');
const Repo = require('../models/repo.model');
const { safeConsoleLog, safeConsoleError } = require('../utils/error-sanitizer.util');

// Retention periods (in days)
const RETENTION_PERIODS = {
  commits: 180, // 6 months
  pulls: 365, // 1 year
  issues: 365, // 1 year
  changelogs: 180, // 6 months
  inactiveRepos: 730, // 2 years (repos not updated in 2 years)
  inactiveUsers: 365, // 1 year (users not synced in 1 year)
};

class DataRetentionService {
  /**
   * Clean up old commits based on retention policy
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupOldCommits(daysToKeep = RETENTION_PERIODS.commits) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await Commit.deleteMany({
        syncedAt: { $lt: cutoffDate },
      });

      safeConsoleLog(`Deleted ${result.deletedCount} old commits (older than ${daysToKeep} days)`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate,
        entity: 'commits',
      };
    } catch (error) {
      safeConsoleError('Failed to cleanup old commits:', error);
      throw error;
    }
  }

  /**
   * Clean up old pull requests
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupOldPulls(daysToKeep = RETENTION_PERIODS.pulls) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Only delete closed/merged PRs that are old
      const result = await Pull.deleteMany({
        state: 'closed',
        syncedAt: { $lt: cutoffDate },
      });

      safeConsoleLog(`Deleted ${result.deletedCount} old pull requests (older than ${daysToKeep} days)`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate,
        entity: 'pulls',
      };
    } catch (error) {
      safeConsoleError('Failed to cleanup old pull requests:', error);
      throw error;
    }
  }

  /**
   * Clean up old issues
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupOldIssues(daysToKeep = RETENTION_PERIODS.issues) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Only delete closed issues that are old
      const result = await Issue.deleteMany({
        state: 'closed',
        syncedAt: { $lt: cutoffDate },
      });

      safeConsoleLog(`Deleted ${result.deletedCount} old issues (older than ${daysToKeep} days)`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate,
        entity: 'issues',
      };
    } catch (error) {
      safeConsoleError('Failed to cleanup old issues:', error);
      throw error;
    }
  }

  /**
   * Clean up old changelogs
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupOldChangelogs(daysToKeep = RETENTION_PERIODS.changelogs) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await Changelog.deleteMany({
        syncedAt: { $lt: cutoffDate },
      });

      safeConsoleLog(`Deleted ${result.deletedCount} old changelogs (older than ${daysToKeep} days)`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate,
        entity: 'changelogs',
      };
    } catch (error) {
      safeConsoleError('Failed to cleanup old changelogs:', error);
      throw error;
    }
  }

  /**
   * Clean up inactive repositories
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupInactiveRepos(daysToKeep = RETENTION_PERIODS.inactiveRepos) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Delete archived and disabled repos not synced recently
      const result = await Repo.deleteMany({
        $or: [{ archived: true }, { disabled: true }],
        syncedAt: { $lt: cutoffDate },
      });

      safeConsoleLog(`Deleted ${result.deletedCount} inactive repositories (older than ${daysToKeep} days)`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate,
        entity: 'repositories',
      };
    } catch (error) {
      safeConsoleError('Failed to cleanup inactive repositories:', error);
      throw error;
    }
  }

  /**
   * Clean up inactive users
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupInactiveUsers(daysToKeep = RETENTION_PERIODS.inactiveUsers) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await User.deleteMany({
        syncedAt: { $lt: cutoffDate },
      });

      safeConsoleLog(`Deleted ${result.deletedCount} inactive users (older than ${daysToKeep} days)`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate,
        entity: 'users',
      };
    } catch (error) {
      safeConsoleError('Failed to cleanup inactive users:', error);
      throw error;
    }
  }

  /**
   * Run full cleanup based on retention policy
   * @returns {Promise<Object>} Cleanup results for all entities
   */
  async runFullCleanup() {
    safeConsoleLog('Starting full data retention cleanup...');

    const results = {
      success: true,
      timestamp: new Date(),
      cleanups: [],
    };

    try {
      // Run all cleanups in parallel
      const [commits, pulls, issues, changelogs, repos, users] = await Promise.allSettled([
        this.cleanupOldCommits(),
        this.cleanupOldPulls(),
        this.cleanupOldIssues(),
        this.cleanupOldChangelogs(),
        this.cleanupInactiveRepos(),
        this.cleanupInactiveUsers(),
      ]);

      // Collect results
      const cleanupResults = [commits, pulls, issues, changelogs, repos, users];

      cleanupResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.cleanups.push(result.value);
        } else {
          results.cleanups.push({
            success: false,
            error: result.reason.message,
          });
          results.success = false;
        }
      });

      // Calculate totals
      results.totalDeleted = results.cleanups.reduce(
        (sum, cleanup) => sum + (cleanup.deletedCount || 0),
        0
      );

      safeConsoleLog(`Full cleanup completed. Total items deleted: ${results.totalDeleted}`);

      return results;
    } catch (error) {
      safeConsoleError('Failed to run full cleanup:', error);
      results.success = false;
      results.error = error.message;
      return results;
    }
  }

  /**
   * Get data retention statistics
   * @returns {Promise<Object>} Statistics about data age and size
   */
  async getRetentionStats() {
    try {
      const stats = await Promise.all([
        // Commits stats
        Commit.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              oldestSyncedAt: { $min: '$syncedAt' },
              newestSyncedAt: { $max: '$syncedAt' },
            },
          },
        ]),

        // Pulls stats
        Pull.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              oldestSyncedAt: { $min: '$syncedAt' },
              newestSyncedAt: { $max: '$syncedAt' },
            },
          },
        ]),

        // Issues stats
        Issue.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              oldestSyncedAt: { $min: '$syncedAt' },
              newestSyncedAt: { $max: '$syncedAt' },
            },
          },
        ]),

        // Changelogs stats
        Changelog.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              oldestSyncedAt: { $min: '$syncedAt' },
              newestSyncedAt: { $max: '$syncedAt' },
            },
          },
        ]),
      ]);

      return {
        commits: stats[0][0] || { total: 0 },
        pulls: stats[1][0] || { total: 0 },
        issues: stats[2][0] || { total: 0 },
        changelogs: stats[3][0] || { total: 0 },
        retentionPeriods: RETENTION_PERIODS,
      };
    } catch (error) {
      safeConsoleError('Failed to get retention stats:', error);
      throw error;
    }
  }
}

module.exports = new DataRetentionService();
