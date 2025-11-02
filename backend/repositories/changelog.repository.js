const BaseRepository = require('./base.repository');
const Changelog = require('../models/changelog.model');

class ChangelogRepository extends BaseRepository {
  constructor() {
    super(Changelog);
  }

  async findByIssueId(issueId, options = {}) {
    return await this.find({ issueId }, {}, options);
  }

  async findByEvent(event, options = {}) {
    return await this.find({ event }, {}, options);
  }

  async findByActor(actorLogin, options = {}) {
    return await this.find({ 'actor.login': actorLogin }, {}, options);
  }

  async getEventDistribution(issueId) {
    return await this.aggregate([
      { $match: { issueId } },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  async getActivityTimeline(issueId) {
    return await this.find(
      { issueId },
      {},
      { sort: { createdAt: 1 } }
    );
  }
}

module.exports = new ChangelogRepository();
