const {
  syncQueue,
  organizationQueue,
  repositoryQueue,
  commitQueue,
  pullQueue,
  issueQueue,
  userQueue,
} = require('../config/queue.config');
const syncService = require('../services/sync.service');
const integrationService = require('../services/integration.service');
const GitHubApiService = require('../services/github-api.service');

/**
 * Process full sync jobs
 */
syncQueue.process(async (job) => {
  const { integrationId } = job.data;

  console.log(`Starting full sync for integration: ${integrationId}`);

  try {
    await job.progress(0);
    const result = await syncService.syncAllWithProgress(integrationId, job);
    await job.progress(100);

    return {
      success: true,
      message: 'Full sync completed',
      integrationId,
      ...result,
    };
  } catch (error) {
    console.error(`Full sync failed for ${integrationId}:`, error.message);
    throw error;
  }
});

/**
 * Process organization sync jobs
 */
organizationQueue.process(async (job) => {
  const { integrationId, accessToken } = job.data;

  try {
    const githubApi = new GitHubApiService(accessToken);
    const result = await syncService.syncOrganizations(integrationId, githubApi);

    return {
      success: true,
      message: 'Organizations synced',
      ...result,
    };
  } catch (error) {
    console.error(`Organization sync failed:`, error.message);
    throw error;
  }
});

/**
 * Process repository sync jobs
 */
repositoryQueue.process(async (job) => {
  const { integrationId, owner, accessToken } = job.data;

  try {
    const githubApi = new GitHubApiService(accessToken);
    const result = await syncService.syncRepositories(integrationId, owner, githubApi);

    return {
      success: true,
      message: 'Repositories synced',
      ...result,
    };
  } catch (error) {
    console.error(`Repository sync failed for ${owner}:`, error.message);
    throw error;
  }
});

/**
 * Process commit sync jobs
 */
commitQueue.process(async (job) => {
  const { integrationId, owner, repo, accessToken } = job.data;

  try {
    const githubApi = new GitHubApiService(accessToken);
    const result = await syncService.syncCommits(integrationId, owner, repo, githubApi);

    return {
      success: true,
      message: 'Commits synced',
      ...result,
    };
  } catch (error) {
    console.error(`Commit sync failed for ${owner}/${repo}:`, error.message);
    throw error;
  }
});

/**
 * Process pull request sync jobs
 */
pullQueue.process(async (job) => {
  const { integrationId, owner, repo, accessToken } = job.data;

  try {
    const githubApi = new GitHubApiService(accessToken);
    const result = await syncService.syncPulls(integrationId, owner, repo, githubApi);

    return {
      success: true,
      message: 'Pull requests synced',
      ...result,
    };
  } catch (error) {
    console.error(`Pull sync failed for ${owner}/${repo}:`, error.message);
    throw error;
  }
});

/**
 * Process issue sync jobs
 */
issueQueue.process(async (job) => {
  const { integrationId, owner, repo, accessToken } = job.data;

  try {
    const githubApi = new GitHubApiService(accessToken);
    const result = await syncService.syncIssues(integrationId, owner, repo, githubApi);

    return {
      success: true,
      message: 'Issues synced',
      ...result,
    };
  } catch (error) {
    console.error(`Issue sync failed for ${owner}/${repo}:`, error.message);
    throw error;
  }
});

/**
 * Process user sync jobs
 */
userQueue.process(async (job) => {
  const { integrationId, accessToken } = job.data;

  try {
    const githubApi = new GitHubApiService(accessToken);
    const result = await syncService.syncUsers(integrationId, githubApi);

    return {
      success: true,
      message: 'Users synced',
      ...result,
    };
  } catch (error) {
    console.error(`User sync failed:`, error.message);
    throw error;
  }
});

console.log('Sync workers initialized and ready to process jobs');

module.exports = {
  syncQueue,
  organizationQueue,
  repositoryQueue,
  commitQueue,
  pullQueue,
  issueQueue,
  userQueue,
};
