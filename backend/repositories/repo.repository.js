const BaseRepository = require('./base.repository');
const Repo = require('../models/repo.model');

class RepoRepository extends BaseRepository {
  constructor() {
    super(Repo);
  }

  async findByIntegrationId(integrationId) {
    return await this.find({ integrationId });
  }

  async findByOrganizationId(organizationId) {
    return await this.find({ organizationId });
  }

  async findByFullName(fullName) {
    return await this.findOne({ fullName });
  }

  async upsertByGithubId(githubId, data) {
    return await this.upsert({ githubId }, data);
  }

  async findTopReposByStars(integrationId, limit = 10) {
    return await this.find(
      { integrationId },
      {},
      { sort: { stargazersCount: -1 }, limit }
    );
  }

  async findByLanguage(integrationId, language) {
    return await this.find({ integrationId, language });
  }

  async countByIntegration(integrationId) {
    return await this.count({ integrationId });
  }

  async findStaleRepos(hours = 24) {
    const staleDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await this.find({ syncedAt: { $lt: staleDate } });
  }
}

module.exports = new RepoRepository();
