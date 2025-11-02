const BaseRepository = require('./base.repository');
const Organization = require('../models/organization.model');

class OrganizationRepository extends BaseRepository {
  constructor() {
    super(Organization);
  }

  async findByIntegrationId(integrationId) {
    return await this.find({ integrationId });
  }

  async findByLogin(login) {
    return await this.findOne({ login });
  }

  async upsertByGithubId(githubId, data) {
    return await this.upsert({ githubId }, data);
  }

  async findStaleOrganizations(hours = 24) {
    const staleDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await this.find({ syncedAt: { $lt: staleDate } });
  }
}

module.exports = new OrganizationRepository();
