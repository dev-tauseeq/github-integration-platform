const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
const { verifyToken, requireIntegration } = require('../middleware/auth.middleware');
const { syncRateLimiter, trackGitHubRateLimit } = require('../middleware/rate-limit.middleware');
const { syncValidation } = require('../middleware/validation.middleware');

// Apply sync rate limiter to all sync routes
router.use(syncRateLimiter);
router.use(trackGitHubRateLimit);

// Full sync
router.post(
  '/all',
  verifyToken,
  requireIntegration,
  syncValidation.integrationId,
  syncController.syncAll
);

// Entity-specific syncs
router.post(
  '/organizations',
  verifyToken,
  requireIntegration,
  syncValidation.integrationId,
  syncController.syncOrganizations
);

router.post(
  '/repositories',
  verifyToken,
  requireIntegration,
  syncValidation.syncRepositories,
  syncController.syncRepositories
);

router.post(
  '/commits',
  verifyToken,
  requireIntegration,
  syncValidation.syncRepoEntity,
  syncController.syncCommits
);

router.post(
  '/pulls',
  verifyToken,
  requireIntegration,
  syncValidation.syncRepoEntity,
  syncController.syncPulls
);

router.post(
  '/issues',
  verifyToken,
  requireIntegration,
  syncValidation.syncRepoEntity,
  syncController.syncIssues
);

router.post(
  '/users',
  verifyToken,
  requireIntegration,
  syncValidation.integrationId,
  syncController.syncUsers
);

// Sync progress and control
router.get(
  '/progress/:integrationId',
  verifyToken,
  syncValidation.syncProgress,
  syncController.getSyncProgress
);

router.post(
  '/cancel',
  verifyToken,
  syncValidation.integrationId,
  syncController.cancelSync
);

module.exports = router;
