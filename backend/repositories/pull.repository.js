const BaseRepository = require('./base.repository');
const Pull = require('../models/pull.model');

class PullRepository extends BaseRepository {
  constructor() {
    super(Pull);
  }

  async findByRepoId(repoId, options = {}) {
    return await this.find({ repoId }, {}, options);
  }

  async findByRepoAndNumber(repoId, number) {
    return await this.findOne({ repoId, number });
  }

  async upsertByRepoAndNumber(repoId, number, data) {
    return await this.upsert({ repoId, number }, data);
  }

  async findByState(repoId, state, options = {}) {
    return await this.find({ repoId, state }, {}, options);
  }

  async findByUser(userLogin, options = {}) {
    return await this.find({ 'user.login': userLogin }, {}, options);
  }

  async countByRepo(repoId) {
    return await this.count({ repoId });
  }

  async countByState(repoId, state) {
    return await this.count({ repoId, state });
  }

  async getPullStats(repoId) {
    return await this.aggregate([
      { $match: { repoId } },
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 },
          totalAdditions: { $sum: '$additions' },
          totalDeletions: { $sum: '$deletions' },
          totalComments: { $sum: '$comments' }
        }
      }
    ]);
  }

  async findMergedPulls(repoId, options = {}) {
    return await this.find({ repoId, merged: true }, {}, options);
  }

  async findTopContributors(repoId, limit = 10) {
    return await this.aggregate([
      { $match: { repoId } },
      {
        $group: {
          _id: '$user.login',
          avatar: { $first: '$user.avatarUrl' },
          pullCount: { $sum: 1 },
          merged: {
            $sum: { $cond: ['$merged', 1, 0] }
          }
        }
      },
      { $sort: { pullCount: -1 } },
      { $limit: limit }
    ]);
  }
}

module.exports = new PullRepository();
