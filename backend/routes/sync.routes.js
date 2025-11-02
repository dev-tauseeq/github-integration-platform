const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
const { verifyToken, requireIntegration } = require('../middleware/auth.middleware');

// Full sync
router.post('/all', verifyToken, requireIntegration, syncController.syncAll);

// Entity-specific syncs
router.post('/organizations', verifyToken, requireIntegration, syncController.syncOrganizations);
router.post('/repositories', verifyToken, requireIntegration, syncController.syncRepositories);
router.post('/commits', verifyToken, requireIntegration, syncController.syncCommits);
router.post('/pulls', verifyToken, requireIntegration, syncController.syncPulls);
router.post('/issues', verifyToken, requireIntegration, syncController.syncIssues);
router.post('/users', verifyToken, requireIntegration, syncController.syncUsers);

// Sync progress and control
router.get('/progress/:integrationId', verifyToken, syncController.getSyncProgress);
router.post('/cancel', verifyToken, syncController.cancelSync);

module.exports = router;
