const { Octokit } = require('@octokit/rest');
const { retryGitHubCall } = require('../utils/retry.util');
const { parallelProcessSafe } = require('../utils/batch.util');
const { safeConsoleError } = require('../utils/error-sanitizer.util');

// Constants
const MAX_COMMITS_PER_REPO = 1000;
const MAX_PULLS_PER_REPO = 500;
const MAX_ISSUES_PER_REPO = 500;
const MAX_PAGES = 10;

class GitHubApiService {
  constructor(accessToken) {
    this.octokit = new Octokit({
      auth: accessToken,
      userAgent: 'GitHub-Integration-App v1.0',
      timeZone: 'UTC',
      baseUrl: 'https://api.github.com',
      retry: {
        enabled: true,
        retries: 3
      },
      throttle: {
        onRateLimit: (retryAfter, options, octokit) => {
          safeConsoleError(`Rate limit hit for ${options.method} ${options.url}`);
          if (options.request.retryCount < 2) {
            console.log(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          safeConsoleError(`Secondary rate limit hit for ${options.method} ${options.url}`);
        }
      }
    });
  }

  // Get rate limit status
  async getRateLimit() {
    try {
      const response = await this.octokit.rateLimit.get();
      return response.data.rate;
    } catch (error) {
      throw new Error(`Failed to get rate limit: ${error.message}`);
    }
  }

  // Get authenticated user
  async getAuthenticatedUser() {
    try {
      const response = await this.octokit.users.getAuthenticated();
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get authenticated user: ${error.message}`);
    }
  }

  // Get user organizations
  async getUserOrganizations() {
    try {
      const response = await this.octokit.orgs.listForAuthenticatedUser({
        per_page: 100
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user organizations: ${error.message}`);
    }
  }

  // Get organization details
  async getOrganization(org) {
    try {
      const response = await this.octokit.orgs.get({ org });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get organization: ${error.message}`);
    }
  }

  // Get repositories for user or organization
  async getRepositories(owner, type = 'all') {
    try {
      const repos = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.octokit.repos.listForAuthenticatedUser({
          per_page: 100,
          page,
          type,
          sort: 'updated',
          direction: 'desc'
        });

        repos.push(...response.data);
        hasMore = response.data.length === 100;
        page++;
      }

      return repos;
    } catch (error) {
      throw new Error(`Failed to get repositories: ${error.message}`);
    }
  }

  // Get organization repositories
  async getOrgRepositories(org) {
    try {
      const repos = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.octokit.repos.listForOrg({
          org,
          per_page: 100,
          page,
          type: 'all'
        });

        repos.push(...response.data);
        hasMore = response.data.length === 100;
        page++;
      }

      return repos;
    } catch (error) {
      throw new Error(`Failed to get org repositories: ${error.message}`);
    }
  }

  // Get commits for a repository
  async getCommits(owner, repo, since = null, until = null) {
    return retryGitHubCall(async () => {
      try {
        const commits = [];
        let page = 1;
        let hasMore = true;

        const params = {
          owner,
          repo,
          per_page: 100,
          page
        };

        if (since) params.since = since;
        if (until) params.until = until;

        while (hasMore && commits.length < MAX_COMMITS_PER_REPO) {
          const response = await this.octokit.repos.listCommits({
            ...params,
            page
          });

          commits.push(...response.data);
          hasMore = response.data.length === 100;
          page++;

          // Limit to prevent excessive API calls
          if (page > MAX_PAGES) break;
        }

        return commits;
      } catch (error) {
        safeConsoleError(`Failed to get commits for ${owner}/${repo}:`, error);
        throw new Error(`Failed to get commits: ${error.message}`);
      }
    });
  }

  // Get commit details
  async getCommit(owner, repo, ref) {
    try {
      const response = await this.octokit.repos.getCommit({
        owner,
        repo,
        ref
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get commit details: ${error.message}`);
    }
  }

  // Get pull requests
  async getPullRequests(owner, repo, state = 'all') {
    return retryGitHubCall(async () => {
      try {
        const pulls = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && pulls.length < MAX_PULLS_PER_REPO) {
          const response = await this.octokit.pulls.list({
            owner,
            repo,
            state,
            per_page: 100,
            page,
            sort: 'updated',
            direction: 'desc'
          });

          pulls.push(...response.data);
          hasMore = response.data.length === 100;
          page++;

          // Limit to prevent excessive API calls
          if (page > MAX_PAGES) break;
        }

        return pulls;
      } catch (error) {
        safeConsoleError(`Failed to get pull requests for ${owner}/${repo}:`, error);
        throw new Error(`Failed to get pull requests: ${error.message}`);
      }
    });
  }

  // Get pull request details
  async getPullRequest(owner, repo, pullNumber) {
    try {
      const response = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get pull request: ${error.message}`);
    }
  }

  // Get issues
  async getIssues(owner, repo, state = 'all') {
    return retryGitHubCall(async () => {
      try {
        const issues = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && issues.length < MAX_ISSUES_PER_REPO) {
          const response = await this.octokit.issues.listForRepo({
            owner,
            repo,
            state,
            per_page: 100,
            page,
            sort: 'updated',
            direction: 'desc'
          });

          // Filter out pull requests (GitHub API returns PRs as issues)
          const filteredIssues = response.data.filter(issue => !issue.pull_request);
          issues.push(...filteredIssues);

          hasMore = response.data.length === 100;
          page++;

          // Limit to prevent excessive API calls
          if (page > MAX_PAGES) break;
        }

        return issues;
      } catch (error) {
        safeConsoleError(`Failed to get issues for ${owner}/${repo}:`, error);
        throw new Error(`Failed to get issues: ${error.message}`);
      }
    });
  }

  // Get issue details
  async getIssue(owner, repo, issueNumber) {
    try {
      const response = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get issue: ${error.message}`);
    }
  }

  // Get issue timeline/events
  async getIssueTimeline(owner, repo, issueNumber) {
    return retryGitHubCall(async () => {
      try {
        const events = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await this.octokit.issues.listEventsForTimeline({
            owner,
            repo,
            issue_number: issueNumber,
            per_page: 100,
            page
          });

          events.push(...response.data);
          hasMore = response.data.length === 100;
          page++;

          // Limit to prevent excessive API calls
          if (page > 3) break;
        }

        return events;
      } catch (error) {
        safeConsoleError(`Failed to get issue timeline for ${owner}/${repo}#${issueNumber}:`, error);
        throw new Error(`Failed to get issue timeline: ${error.message}`);
      }
    });
  }

  /**
   * Batch fetch users with concurrency control
   * @param {Array<string>} usernames - Array of usernames to fetch
   * @returns {Promise<Object>} Results and errors
   */
  async batchGetUsers(usernames) {
    return parallelProcessSafe(usernames, async (username) => {
      return await this.getUser(username);
    });
  }

  /**
   * Batch fetch commits with details
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Array<string>} shas - Array of commit SHAs
   * @returns {Promise<Object>} Results and errors
   */
  async batchGetCommitDetails(owner, repo, shas) {
    return parallelProcessSafe(shas, async (sha) => {
      return await this.getCommit(owner, repo, sha);
    });
  }

  // Get organization members
  async getOrganizationMembers(org) {
    try {
      const members = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.octokit.orgs.listMembers({
          org,
          per_page: 100,
          page
        });

        members.push(...response.data);
        hasMore = response.data.length === 100;
        page++;
      }

      return members;
    } catch (error) {
      throw new Error(`Failed to get organization members: ${error.message}`);
    }
  }

  // Get user details
  async getUser(username) {
    try {
      const response = await this.octokit.users.getByUsername({
        username
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Get repository contributors
  async getRepositoryContributors(owner, repo) {
    try {
      const contributors = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.octokit.repos.listContributors({
          owner,
          repo,
          per_page: 100,
          page
        });

        contributors.push(...response.data);
        hasMore = response.data.length === 100;
        page++;
      }

      return contributors;
    } catch (error) {
      throw new Error(`Failed to get repository contributors: ${error.message}`);
    }
  }
}

module.exports = GitHubApiService;
