const { syncQueue } = require('../config/queue.config');
const { redisClient } = require('../middleware/rate-limit.middleware');
const mongoose = require('mongoose');
const { respondWith } = require('../helpers/response.helper');

class HealthController {
  /**
   * Basic health check
   * @route GET /api/health
   */
  async healthCheck(req, res, next) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      };

      respondWith(res, 200, health);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Detailed health check with service status
   * @route GET /api/health/detailed
   */
  async detailedHealthCheck(req, res, next) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {},
      };

      // Check MongoDB
      try {
        const dbState = mongoose.connection.readyState;
        health.services.mongodb = {
          status: dbState === 1 ? 'connected' : 'disconnected',
          state: dbState,
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        };
      } catch (error) {
        health.services.mongodb = {
          status: 'error',
          error: error.message,
        };
        health.status = 'degraded';
      }

      // Check Redis
      try {
        await redisClient.ping();
        health.services.redis = {
          status: 'connected',
          mode: redisClient.mode,
        };
      } catch (error) {
        health.services.redis = {
          status: 'error',
          error: error.message,
        };
        health.status = 'degraded';
      }

      // Check Queue
      try {
        const queueHealth = await this.getQueueHealth();
        health.services.queue = queueHealth;
      } catch (error) {
        health.services.queue = {
          status: 'error',
          error: error.message,
        };
        health.status = 'degraded';
      }

      // Memory usage
      const memUsage = process.memoryUsage();
      health.memory = {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      };

      respondWith(res, health.status === 'healthy' ? 200 : 503, health);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get queue health status
   * @returns {Promise<Object>} Queue health information
   */
  async getQueueHealth() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        syncQueue.getWaitingCount(),
        syncQueue.getActiveCount(),
        syncQueue.getCompletedCount(),
        syncQueue.getFailedCount(),
        syncQueue.getDelayedCount(),
      ]);

      return {
        status: 'operational',
        jobs: {
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + completed + failed + delayed,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get sync status for an integration
   * @route GET /api/health/sync/:integrationId
   */
  async getSyncStatus(req, res, next) {
    try {
      const { integrationId } = req.params;

      // Get jobs for this integration
      const [waiting, active, completed, failed] = await Promise.all([
        syncQueue.getJobs(['waiting'], 0, -1),
        syncQueue.getJobs(['active'], 0, -1),
        syncQueue.getJobs(['completed'], 0, 10),
        syncQueue.getJobs(['failed'], 0, 10),
      ]);

      // Filter jobs for this integration
      const filterByIntegration = (jobs) =>
        jobs.filter((job) => job.data.integrationId === integrationId);

      const integrationJobs = {
        waiting: filterByIntegration(waiting),
        active: filterByIntegration(active),
        completed: filterByIntegration(completed).slice(0, 5),
        failed: filterByIntegration(failed).slice(0, 5),
      };

      const status = {
        integrationId,
        status: integrationJobs.active.length > 0 ? 'syncing' : 'idle',
        jobs: {
          waiting: integrationJobs.waiting.length,
          active: integrationJobs.active.length,
          completed: integrationJobs.completed.length,
          failed: integrationJobs.failed.length,
        },
        recentJobs: {
          active: integrationJobs.active.map((j) => ({
            id: j.id,
            progress: j.progress,
            timestamp: j.timestamp,
          })),
          completed: integrationJobs.completed.map((j) => ({
            id: j.id,
            finishedOn: j.finishedOn,
            returnvalue: j.returnvalue,
          })),
          failed: integrationJobs.failed.map((j) => ({
            id: j.id,
            failedReason: j.failedReason,
            finishedOn: j.finishedOn,
          })),
        },
      };

      respondWith(res, 200, status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get queue dashboard stats
   * @route GET /api/health/queue/stats
   */
  async getQueueStats(req, res, next) {
    try {
      const stats = await this.getQueueHealth();

      // Get job counts by state
      const jobCounts = await syncQueue.getJobCounts();

      // Get recent jobs
      const [recentCompleted, recentFailed] = await Promise.all([
        syncQueue.getJobs(['completed'], 0, 10),
        syncQueue.getJobs(['failed'], 0, 10),
      ]);

      respondWith(res, 200, {
        ...stats,
        jobCounts,
        recentJobs: {
          completed: recentCompleted.map((j) => ({
            id: j.id,
            data: j.data,
            finishedOn: j.finishedOn,
            returnvalue: j.returnvalue,
          })),
          failed: recentFailed.map((j) => ({
            id: j.id,
            data: j.data,
            failedReason: j.failedReason,
            finishedOn: j.finishedOn,
            attemptsMade: j.attemptsMade,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HealthController();
