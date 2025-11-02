const BaseRepository = require('./base.repository');
const User = require('../models/user.model');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByIntegrationId(integrationId) {
    return await this.find({ integrationId });
  }

  async findByOrganizationId(organizationId) {
    return await this.find({ organizationId });
  }

  async findByLogin(login) {
    return await this.findOne({ login });
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async upsertByGithubId(githubId, data) {
    return await this.upsert({ githubId }, data);
  }

  async countByIntegration(integrationId) {
    return await this.count({ integrationId });
  }

  async findStaleUsers(hours = 24) {
    const staleDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await this.find({ syncedAt: { $lt: staleDate } });
  }

  async findTopContributors(integrationId, limit = 10) {
    return await this.find(
      { integrationId },
      {},
      { sort: { publicRepos: -1 }, limit }
    );
  }
}

module.exports = new UserRepository();
