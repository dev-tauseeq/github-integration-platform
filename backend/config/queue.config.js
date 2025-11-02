const Bull = require('bull');
const { queueConfig } = require('./redis.config');

// Sync job options
const syncJobOptions = {
  priority: 1,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  timeout: 30 * 60 * 1000, // 30 minutes
  removeOnComplete: 50,
  removeOnFail: 100,
};

// Rate limit options for GitHub API
const rateLimitOptions = {
  max: 5000, // GitHub rate limit
  duration: 60 * 60 * 1000, // 1 hour
  bounceBack: false,
};

// Create queues
const syncQueue = new Bull('github-sync', queueConfig);
const organizationQueue = new Bull('github-org-sync', queueConfig);
const repositoryQueue = new Bull('github-repo-sync', queueConfig);
const commitQueue = new Bull('github-commit-sync', queueConfig);
const pullQueue = new Bull('github-pull-sync', queueConfig);
const issueQueue = new Bull('github-issue-sync', queueConfig);
const userQueue = new Bull('github-user-sync', queueConfig);

// Queue event handlers
const setupQueueEvents = (queue, queueName) => {
  queue.on('error', (error) => {
    console.error(`[${queueName}] Queue error:`, error.message);
  });

  queue.on('waiting', (jobId) => {
    console.log(`[${queueName}] Job ${jobId} is waiting`);
  });

  queue.on('active', (job) => {
    console.log(`[${queueName}] Job ${job.id} started processing`);
  });

  queue.on('completed', (job, result) => {
    console.log(`[${queueName}] Job ${job.id} completed:`, result.message || 'Success');
  });

  queue.on('failed', (job, err) => {
    console.error(`[${queueName}] Job ${job.id} failed:`, err.message);
  });

  queue.on('stalled', (job) => {
    console.warn(`[${queueName}] Job ${job.id} stalled`);
  });
};

// Setup events for all queues
setupQueueEvents(syncQueue, 'SyncQueue');
setupQueueEvents(organizationQueue, 'OrganizationQueue');
setupQueueEvents(repositoryQueue, 'RepositoryQueue');
setupQueueEvents(commitQueue, 'CommitQueue');
setupQueueEvents(pullQueue, 'PullQueue');
setupQueueEvents(issueQueue, 'IssueQueue');
setupQueueEvents(userQueue, 'UserQueue');

// Graceful shutdown
const closeQueues = async () => {
  await Promise.all([
    syncQueue.close(),
    organizationQueue.close(),
    repositoryQueue.close(),
    commitQueue.close(),
    pullQueue.close(),
    issueQueue.close(),
    userQueue.close(),
  ]);
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queues...');
  await closeQueues();
  process.exit(0);
});

module.exports = {
  syncQueue,
  organizationQueue,
  repositoryQueue,
  commitQueue,
  pullQueue,
  issueQueue,
  userQueue,
  syncJobOptions,
  rateLimitOptions,
  closeQueues,
};
