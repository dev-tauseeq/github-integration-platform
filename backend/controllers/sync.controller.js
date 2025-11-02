const syncService = require('../services/sync.service');
const integrationService = require('../services/integration.service');
const { respondWith } = require('../helpers/response.helper');
const { AppError } = require('../helpers/error.helper');

class SyncController {
  /**
   * Trigger full synchronization
   * @route POST /api/sync/all
   */
  async syncAll(req, res, next) {
    try {
      const { integrationId } = req.body;

      if (!integrationId) {
        throw new AppError('Integration ID is required', 400);
      }

      // Verify integration exists
      const integration = await integrationService.getIntegrationById(integrationId);

      // Start sync in background (we'll add queue later)
      // For now, run synchronously
      syncService.syncAll(integrationId)
        .catch(error => {
          console.error(`Background sync failed for integration ${integrationId}:`, error);
        });

      respondWith(res, 200, {
        success: true,
        message: 'Full synchronization started',
        integrationId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync organizations only
   * @route POST /api/sync/organizations
   */
  async syncOrganizations(req, res, next) {
    try {
      const { integrationId } = req.body;

      if (!integrationId) {
        throw new AppError('Integration ID is required', 400);
      }

      const integration = await integrationService.getIntegrationById(integrationId);
      const GitHubApiService = require('../services/github-api.service');
      const githubApi = new GitHubApiService(integration.accessToken);

      const result = await syncService.syncOrganizations(integrationId, githubApi);

      respondWith(res, 200, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync repositories
   * @route POST /api/sync/repositories
   */
  async syncRepositories(req, res, next) {
    try {
      const { integrationId, owner } = req.body;

      if (!integrationId || !owner) {
        throw new AppError('Integration ID and owner are required', 400);
      }

      const integration = await integrationService.getIntegrationById(integrationId);
      const GitHubApiService = require('../services/github-api.service');
      const githubApi = new GitHubApiService(integration.accessToken);

      const result = await syncService.syncRepositories(integrationId, owner, githubApi);

      respondWith(res, 200, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync commits for a repository
   * @route POST /api/sync/commits
   */
  async syncCommits(req, res, next) {
    try {
      const { integrationId, owner, repo } = req.body;

      if (!integrationId || !owner || !repo) {
        throw new AppError('Integration ID, owner, and repo are required', 400);
      }

      const integration = await integrationService.getIntegrationById(integrationId);
      const GitHubApiService = require('../services/github-api.service');
      const githubApi = new GitHubApiService(integration.accessToken);

      const result = await syncService.syncCommits(integrationId, owner, repo, githubApi);

      respondWith(res, 200, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync pull requests for a repository
   * @route POST /api/sync/pulls
   */
  async syncPulls(req, res, next) {
    try {
      const { integrationId, owner, repo } = req.body;

      if (!integrationId || !owner || !repo) {
        throw new AppError('Integration ID, owner, and repo are required', 400);
      }

      const integration = await integrationService.getIntegrationById(integrationId);
      const GitHubApiService = require('../services/github-api.service');
      const githubApi = new GitHubApiService(integration.accessToken);

      const result = await syncService.syncPulls(integrationId, owner, repo, githubApi);

      respondWith(res, 200, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync issues for a repository
   * @route POST /api/sync/issues
   */
  async syncIssues(req, res, next) {
    try {
      const { integrationId, owner, repo } = req.body;

      if (!integrationId || !owner || !repo) {
        throw new AppError('Integration ID, owner, and repo are required', 400);
      }

      const integration = await integrationService.getIntegrationById(integrationId);
      const GitHubApiService = require('../services/github-api.service');
      const githubApi = new GitHubApiService(integration.accessToken);

      const result = await syncService.syncIssues(integrationId, owner, repo, githubApi);

      respondWith(res, 200, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync users/members
   * @route POST /api/sync/users
   */
  async syncUsers(req, res, next) {
    try {
      const { integrationId } = req.body;

      if (!integrationId) {
        throw new AppError('Integration ID is required', 400);
      }

      const integration = await integrationService.getIntegrationById(integrationId);
      const GitHubApiService = require('../services/github-api.service');
      const githubApi = new GitHubApiService(integration.accessToken);

      const result = await syncService.syncUsers(integrationId, githubApi);

      respondWith(res, 200, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sync progress
   * @route GET /api/sync/progress/:integrationId
   */
  async getSyncProgress(req, res, next) {
    try {
      const { integrationId } = req.params;

      if (!integrationId) {
        throw new AppError('Integration ID is required', 400);
      }

      const progress = syncService.getSyncProgress(integrationId);

      if (!progress) {
        respondWith(res, 200, {
          status: 'idle',
          message: 'No sync in progress'
        });
      } else {
        respondWith(res, 200, progress);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel sync
   * @route POST /api/sync/cancel
   */
  async cancelSync(req, res, next) {
    try {
      const { integrationId } = req.body;

      if (!integrationId) {
        throw new AppError('Integration ID is required', 400);
      }

      syncService.clearSyncProgress(integrationId);

      respondWith(res, 200, {
        success: true,
        message: 'Sync cancelled'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SyncController();
