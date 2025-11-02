const GitHubApiService = require('./github-api.service');
const integrationService = require('./integration.service');
const organizationRepo = require('../repositories/organization.repository');
const repoRepo = require('../repositories/repo.repository');
const commitRepo = require('../repositories/commit.repository');
const pullRepo = require('../repositories/pull.repository');
const issueRepo = require('../repositories/issue.repository');
const changelogRepo = require('../repositories/changelog.repository');
const userRepo = require('../repositories/user.repository');
const mongoose = require('mongoose');
const { parallelProcessSafe, processBatch } = require('../utils/batch.util');
const { safeConsoleError, safeConsoleLog } = require('../utils/error-sanitizer.util');
const { redisClient } = require('../middleware/rate-limit.middleware');

class SyncService {
  constructor() {
    this.syncProgress = new Map();
  }

  // Get sync progress for a specific integration
  getSyncProgress(integrationId) {
    return this.syncProgress.get(integrationId) || null;
  }

  // Update sync progress (now uses Redis for distributed systems)
  async updateSyncProgress(integrationId, progress) {
    const progressData = {
      ...progress,
      timestamp: new Date().toISOString()
    };

    // Store in memory
    this.syncProgress.set(integrationId, progressData);

    // Store in Redis for distributed systems
    try {
      await redisClient.setex(
        `sync:progress:${integrationId}`,
        3600, // 1 hour TTL
        JSON.stringify(progressData)
      );
    } catch (error) {
      safeConsoleError('Failed to update sync progress in Redis:', error);
    }

    return progressData;
  }

  // Clear sync progress
  async clearSyncProgress(integrationId) {
    this.syncProgress.delete(integrationId);

    try {
      await redisClient.del(`sync:progress:${integrationId}`);
    } catch (error) {
      safeConsoleError('Failed to clear sync progress from Redis:', error);
    }
  }

  /**
   * Sync all with progress reporting (for queue worker)
   */
  async syncAllWithProgress(integrationId, job) {
    const integration = await integrationService.getIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const githubApi = new GitHubApiService(integration.accessToken);

    await this.updateSyncProgress(integrationId, {
      status: 'running',
      message: 'Starting full sync',
      current: 0,
      total: 100
    });

    // Sync organizations
    await this.syncOrganizations(integrationId, githubApi);
    if (job) await job.progress(20);

    // Sync repositories
    const repos = await repoRepo.findByIntegrationId(integrationId);
    let current = 0;
    const total = repos.length;

    for (const repo of repos) {
      const [owner, repoName] = repo.fullName.split('/');

      // Sync commits, pulls, and issues for each repo
      await this.syncCommits(integrationId, owner, repoName, githubApi);
      await this.syncPulls(integrationId, owner, repoName, githubApi);
      await this.syncIssues(integrationId, owner, repoName, githubApi);

      current++;
      const progress = 20 + Math.floor((current / total) * 60); // 20% to 80%
      if (job) await job.progress(progress);

      await this.updateSyncProgress(integrationId, {
        status: 'running',
        message: `Syncing repository ${repo.fullName}`,
        current,
        total
      });
    }

    // Sync users
    await this.syncUsers(integrationId, githubApi);
    if (job) await job.progress(90);

    // Update integration last sync time
    await integrationService.updateLastSync(integrationId);

    await this.updateSyncProgress(integrationId, {
      status: 'completed',
      message: 'Sync completed successfully',
      current: total,
      total
    });

    // Clear progress after 5 minutes
    setTimeout(() => this.clearSyncProgress(integrationId), 5 * 60 * 1000);

    return { success: true, message: 'Full sync completed', repositoriesSynced: total };
  }

  // Full sync for an integration
  async syncAll(integrationId) {
    try {
      const integration = await integrationService.getIntegrationById(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const githubApi = new GitHubApiService(integration.accessToken);

      this.updateSyncProgress(integrationId, {
        status: 'running',
        message: 'Starting full sync',
        current: 0,
        total: 100
      });

      // Sync organizations
      await this.syncOrganizations(integrationId, githubApi);

      // Sync repositories
      const repos = await repoRepo.findByIntegrationId(integrationId);

      let current = 0;
      const total = repos.length;

      for (const repo of repos) {
        const [owner, repoName] = repo.fullName.split('/');

        // Sync commits, pulls, and issues for each repo
        await this.syncCommits(integrationId, owner, repoName, githubApi);
        await this.syncPulls(integrationId, owner, repoName, githubApi);
        await this.syncIssues(integrationId, owner, repoName, githubApi);

        current++;
        this.updateSyncProgress(integrationId, {
          status: 'running',
          message: `Syncing repository ${repo.fullName}`,
          current,
          total
        });
      }

      // Sync users
      await this.syncUsers(integrationId, githubApi);

      // Update integration last sync time
      await integrationService.updateLastSync(integrationId);

      this.updateSyncProgress(integrationId, {
        status: 'completed',
        message: 'Sync completed successfully',
        current: total,
        total
      });

      // Clear progress after 5 minutes
      setTimeout(() => this.clearSyncProgress(integrationId), 5 * 60 * 1000);

      return { success: true, message: 'Full sync completed' };
    } catch (error) {
      this.updateSyncProgress(integrationId, {
        status: 'error',
        message: error.message,
        current: 0,
        total: 0
      });
      throw error;
    }
  }

  // Sync organizations
  async syncOrganizations(integrationId, githubApi) {
    try {
      this.updateSyncProgress(integrationId, {
        status: 'running',
        message: 'Syncing organizations',
        current: 0,
        total: 100
      });

      const user = await githubApi.getAuthenticatedUser();
      const orgs = await githubApi.getUserOrganizations();

      // Sync user as an organization
      const userData = {
        integrationId: new mongoose.Types.ObjectId(integrationId),
        githubId: user.id,
        login: user.login,
        name: user.name,
        description: user.bio,
        url: user.url,
        htmlUrl: user.html_url,
        avatarUrl: user.avatar_url,
        location: user.location,
        email: user.email,
        publicRepos: user.public_repos,
        publicGists: user.public_gists,
        followers: user.followers,
        following: user.following,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        type: 'User',
        syncedAt: new Date()
      };

      await organizationRepo.upsertByGithubId(user.id, userData);

      // Sync organizations
      for (const org of orgs) {
        const orgDetails = await githubApi.getOrganization(org.login);

        const orgData = {
          integrationId: new mongoose.Types.ObjectId(integrationId),
          githubId: orgDetails.id,
          login: orgDetails.login,
          name: orgDetails.name,
          description: orgDetails.description,
          url: orgDetails.url,
          htmlUrl: orgDetails.html_url,
          avatarUrl: orgDetails.avatar_url,
          location: orgDetails.location,
          email: orgDetails.email,
          publicRepos: orgDetails.public_repos,
          publicGists: orgDetails.public_gists,
          followers: orgDetails.followers,
          following: orgDetails.following,
          createdAt: orgDetails.created_at,
          updatedAt: orgDetails.updated_at,
          type: 'Organization',
          syncedAt: new Date()
        };

        await organizationRepo.upsertByGithubId(orgDetails.id, orgData);

        // Sync repositories for this organization
        await this.syncRepositories(integrationId, orgDetails.login, githubApi);
      }

      // Also sync user's personal repositories
      await this.syncRepositories(integrationId, user.login, githubApi);

      return { success: true, message: 'Organizations synced' };
    } catch (error) {
      throw new Error(`Failed to sync organizations: ${error.message}`);
    }
  }

  // Sync repositories
  async syncRepositories(integrationId, owner, githubApi) {
    try {
      const repos = await githubApi.getOrgRepositories(owner);
      const organization = await organizationRepo.findByLogin(owner);

      for (const repo of repos) {
        const repoData = {
          integrationId: new mongoose.Types.ObjectId(integrationId),
          organizationId: organization ? organization._id : null,
          githubId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          private: repo.private,
          fork: repo.fork,
          url: repo.url,
          htmlUrl: repo.html_url,
          cloneUrl: repo.clone_url,
          gitUrl: repo.git_url,
          sshUrl: repo.ssh_url,
          homepage: repo.homepage,
          language: repo.language,
          size: repo.size,
          stargazersCount: repo.stargazers_count,
          watchersCount: repo.watchers_count,
          forksCount: repo.forks_count,
          openIssuesCount: repo.open_issues_count,
          defaultBranch: repo.default_branch,
          topics: repo.topics || [],
          hasIssues: repo.has_issues,
          hasProjects: repo.has_projects,
          hasWiki: repo.has_wiki,
          hasPages: repo.has_pages,
          hasDownloads: repo.has_downloads,
          archived: repo.archived,
          disabled: repo.disabled,
          visibility: repo.visibility,
          pushedAt: repo.pushed_at,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          owner: {
            login: repo.owner.login,
            avatarUrl: repo.owner.avatar_url,
            type: repo.owner.type
          },
          syncedAt: new Date()
        };

        await repoRepo.upsertByGithubId(repo.id, repoData);
      }

      return { success: true, message: 'Repositories synced' };
    } catch (error) {
      throw new Error(`Failed to sync repositories: ${error.message}`);
    }
  }

  // Sync commits for a repository
  async syncCommits(integrationId, owner, repoName, githubApi) {
    try {
      const repo = await repoRepo.findByFullName(`${owner}/${repoName}`);
      if (!repo) {
        console.warn(`Repository ${owner}/${repoName} not found in database`);
        return;
      }

      // Get commits from last 30 days
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const commits = await githubApi.getCommits(owner, repoName, since);

      for (const commit of commits) {
        // Fetch detailed commit info
        let detailedCommit;
        try {
          detailedCommit = await githubApi.getCommit(owner, repoName, commit.sha);
        } catch (error) {
          console.warn(`Failed to fetch details for commit ${commit.sha}: ${error.message}`);
          detailedCommit = commit;
        }

        const commitData = {
          integrationId: new mongoose.Types.ObjectId(integrationId),
          repoId: repo._id,
          sha: commit.sha,
          message: commit.commit.message,
          author: {
            name: commit.commit.author.name,
            email: commit.commit.author.email,
            date: commit.commit.author.date,
            login: commit.author?.login,
            avatarUrl: commit.author?.avatar_url
          },
          committer: {
            name: commit.commit.committer.name,
            email: commit.commit.committer.email,
            date: commit.commit.committer.date,
            login: commit.committer?.login,
            avatarUrl: commit.committer?.avatar_url
          },
          url: commit.url,
          htmlUrl: commit.html_url,
          commentCount: commit.commit.comment_count,
          additions: detailedCommit.stats?.additions || 0,
          deletions: detailedCommit.stats?.deletions || 0,
          totalChanges: detailedCommit.stats?.total || 0,
          files: detailedCommit.files?.map(file => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes
          })) || [],
          parents: commit.parents?.map(parent => ({
            sha: parent.sha,
            url: parent.url
          })) || [],
          verified: commit.commit.verification?.verified || false,
          signature: commit.commit.verification?.signature,
          syncedAt: new Date()
        };

        await commitRepo.upsertBySha(commit.sha, commitData);
      }

      return { success: true, message: 'Commits synced' };
    } catch (error) {
      console.error(`Failed to sync commits for ${owner}/${repoName}: ${error.message}`);
      // Don't throw, continue with other syncs
    }
  }

  // Sync pull requests
  async syncPulls(integrationId, owner, repoName, githubApi) {
    try {
      const repo = await repoRepo.findByFullName(`${owner}/${repoName}`);
      if (!repo) {
        console.warn(`Repository ${owner}/${repoName} not found in database`);
        return;
      }

      const pulls = await githubApi.getPullRequests(owner, repoName);

      for (const pull of pulls) {
        const pullData = {
          integrationId: new mongoose.Types.ObjectId(integrationId),
          repoId: repo._id,
          githubId: pull.id,
          number: pull.number,
          title: pull.title,
          body: pull.body,
          state: pull.state,
          locked: pull.locked,
          user: {
            login: pull.user.login,
            avatarUrl: pull.user.avatar_url,
            type: pull.user.type
          },
          labels: pull.labels?.map(label => ({
            name: label.name,
            color: label.color,
            description: label.description
          })) || [],
          milestone: pull.milestone ? {
            title: pull.milestone.title,
            number: pull.milestone.number,
            state: pull.milestone.state
          } : null,
          assignees: pull.assignees?.map(assignee => ({
            login: assignee.login,
            avatarUrl: assignee.avatar_url
          })) || [],
          requestedReviewers: pull.requested_reviewers?.map(reviewer => ({
            login: reviewer.login,
            avatarUrl: reviewer.avatar_url
          })) || [],
          head: {
            ref: pull.head.ref,
            sha: pull.head.sha,
            label: pull.head.label,
            user: {
              login: pull.head.user.login,
              avatarUrl: pull.head.user.avatar_url
            }
          },
          base: {
            ref: pull.base.ref,
            sha: pull.base.sha,
            label: pull.base.label
          },
          draft: pull.draft,
          merged: pull.merged,
          mergeable: pull.mergeable,
          mergedBy: pull.merged_by ? {
            login: pull.merged_by.login,
            avatarUrl: pull.merged_by.avatar_url
          } : null,
          comments: pull.comments,
          reviewComments: pull.review_comments,
          commits: pull.commits,
          additions: pull.additions,
          deletions: pull.deletions,
          changedFiles: pull.changed_files,
          url: pull.url,
          htmlUrl: pull.html_url,
          diffUrl: pull.diff_url,
          patchUrl: pull.patch_url,
          createdAt: pull.created_at,
          updatedAt: pull.updated_at,
          closedAt: pull.closed_at,
          mergedAt: pull.merged_at,
          syncedAt: new Date()
        };

        await pullRepo.upsertByRepoAndNumber(repo._id, pull.number, pullData);
      }

      return { success: true, message: 'Pull requests synced' };
    } catch (error) {
      console.error(`Failed to sync pulls for ${owner}/${repoName}: ${error.message}`);
      // Don't throw, continue with other syncs
    }
  }

  // Sync issues
  async syncIssues(integrationId, owner, repoName, githubApi) {
    try {
      const repo = await repoRepo.findByFullName(`${owner}/${repoName}`);
      if (!repo) {
        console.warn(`Repository ${owner}/${repoName} not found in database`);
        return;
      }

      const issues = await githubApi.getIssues(owner, repoName);

      for (const issue of issues) {
        const issueData = {
          integrationId: new mongoose.Types.ObjectId(integrationId),
          repoId: repo._id,
          githubId: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          stateReason: issue.state_reason,
          locked: issue.locked,
          user: {
            login: issue.user.login,
            avatarUrl: issue.user.avatar_url,
            type: issue.user.type
          },
          labels: issue.labels?.map(label => ({
            name: label.name,
            color: label.color,
            description: label.description
          })) || [],
          assignees: issue.assignees?.map(assignee => ({
            login: assignee.login,
            avatarUrl: assignee.avatar_url
          })) || [],
          milestone: issue.milestone ? {
            title: issue.milestone.title,
            number: issue.milestone.number,
            state: issue.milestone.state,
            description: issue.milestone.description
          } : null,
          comments: issue.comments,
          closedBy: issue.closed_by ? {
            login: issue.closed_by.login,
            avatarUrl: issue.closed_by.avatar_url
          } : null,
          pullRequest: issue.pull_request ? {
            url: issue.pull_request.url,
            htmlUrl: issue.pull_request.html_url,
            diffUrl: issue.pull_request.diff_url,
            patchUrl: issue.pull_request.patch_url
          } : null,
          url: issue.url,
          htmlUrl: issue.html_url,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          closedAt: issue.closed_at,
          syncedAt: new Date()
        };

        const savedIssue = await issueRepo.upsertByRepoAndNumber(repo._id, issue.number, issueData);

        // Sync issue timeline/changelog
        await this.syncChangelogs(integrationId, owner, repoName, issue.number, savedIssue._id, githubApi);
      }

      return { success: true, message: 'Issues synced' };
    } catch (error) {
      console.error(`Failed to sync issues for ${owner}/${repoName}: ${error.message}`);
      // Don't throw, continue with other syncs
    }
  }

  // Sync changelogs (issue events)
  async syncChangelogs(integrationId, owner, repoName, issueNumber, issueId, githubApi) {
    try {
      const events = await githubApi.getIssueTimeline(owner, repoName, issueNumber);

      for (const event of events) {
        const changelogData = {
          integrationId: new mongoose.Types.ObjectId(integrationId),
          issueId,
          githubId: event.id,
          event: event.event,
          actor: event.actor ? {
            login: event.actor.login,
            avatarUrl: event.actor.avatar_url,
            type: event.actor.type
          } : null,
          commitId: event.commit_id,
          commitUrl: event.commit_url,
          label: event.label ? {
            name: event.label.name,
            color: event.label.color
          } : null,
          assignee: event.assignee ? {
            login: event.assignee.login,
            avatarUrl: event.assignee.avatar_url
          } : null,
          milestone: event.milestone ? {
            title: event.milestone.title
          } : null,
          rename: event.rename ? {
            from: event.rename.from,
            to: event.rename.to
          } : null,
          reviewRequester: event.review_requester ? {
            login: event.review_requester.login,
            avatarUrl: event.review_requester.avatar_url
          } : null,
          requestedReviewer: event.requested_reviewer ? {
            login: event.requested_reviewer.login,
            avatarUrl: event.requested_reviewer.avatar_url
          } : null,
          url: event.url,
          createdAt: event.created_at,
          syncedAt: new Date()
        };

        await changelogRepo.create(changelogData);
      }

      return { success: true, message: 'Changelogs synced' };
    } catch (error) {
      console.error(`Failed to sync changelogs for issue #${issueNumber}: ${error.message}`);
      // Don't throw, continue with other syncs
    }
  }

  // Sync users with batch processing
  async syncUsers(integrationId, githubApi) {
    try {
      const orgs = await organizationRepo.findByIntegrationId(integrationId);

      for (const org of orgs) {
        if (org.type === 'Organization') {
          const members = await githubApi.getOrganizationMembers(org.login);

          // Batch fetch user details
          const { results: userDetails, errors } = await parallelProcessSafe(
            members,
            async (member) => await githubApi.getUser(member.login)
          );

          if (errors.length > 0) {
            safeConsoleError(`Failed to fetch ${errors.length} users`);
          }

          // Save users in batches with transaction
          for (const userDetail of userDetails) {
            const userData = {
              integrationId: new mongoose.Types.ObjectId(integrationId),
              organizationId: org._id,
              githubId: userDetail.id,
              login: userDetail.login,
              name: userDetail.name,
              email: userDetail.email,
              avatarUrl: userDetail.avatar_url,
              url: userDetail.url,
              htmlUrl: userDetail.html_url,
              type: userDetail.type,
              siteAdmin: userDetail.site_admin,
              company: userDetail.company,
              blog: userDetail.blog,
              location: userDetail.location,
              bio: userDetail.bio,
              twitterUsername: userDetail.twitter_username,
              publicRepos: userDetail.public_repos,
              publicGists: userDetail.public_gists,
              followers: userDetail.followers,
              following: userDetail.following,
              createdAt: userDetail.created_at,
              updatedAt: userDetail.updated_at,
              syncedAt: new Date()
            };

            await userRepo.upsertByGithubId(userDetail.id, userData);
          }
        }
      }

      return { success: true, message: 'Users synced' };
    } catch (error) {
      safeConsoleError(`Failed to sync users:`, error);
      // Don't throw, continue with other syncs
    }
  }
}

module.exports = new SyncService();
