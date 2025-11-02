const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public health check
router.get('/', healthController.healthCheck);

// Detailed health check (requires authentication)
router.get('/detailed', verifyToken, healthController.detailedHealthCheck);

// Sync status for integration
router.get('/sync/:integrationId', verifyToken, healthController.getSyncStatus);

// Queue statistics
router.get('/queue/stats', verifyToken, healthController.getQueueStats);

module.exports = router;
