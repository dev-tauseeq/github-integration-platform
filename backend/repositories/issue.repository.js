const BaseRepository = require('./base.repository');
const Issue = require('../models/issue.model');

class IssueRepository extends BaseRepository {
  constructor() {
    super(Issue);
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

  async findByLabel(repoId, labelName, options = {}) {
    return await this.find({ repoId, 'labels.name': labelName }, {}, options);
  }

  async countByRepo(repoId) {
    return await this.count({ repoId });
  }

  async countByState(repoId, state) {
    return await this.count({ repoId, state });
  }

  async getIssueStats(repoId) {
    return await this.aggregate([
      { $match: { repoId } },
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 },
          totalComments: { $sum: '$comments' }
        }
      }
    ]);
  }

  async findTopReporters(repoId, limit = 10) {
    return await this.aggregate([
      { $match: { repoId } },
      {
        $group: {
          _id: '$user.login',
          avatar: { $first: '$user.avatarUrl' },
          issueCount: { $sum: 1 },
          open: {
            $sum: { $cond: [{ $eq: ['$state', 'open'] }, 1, 0] }
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$state', 'closed'] }, 1, 0] }
          }
        }
      },
      { $sort: { issueCount: -1 } },
      { $limit: limit }
    ]);
  }

  async getLabelDistribution(repoId) {
    return await this.aggregate([
      { $match: { repoId } },
      { $unwind: '$labels' },
      {
        $group: {
          _id: '$labels.name',
          count: { $sum: 1 },
          color: { $first: '$labels.color' }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }
}

module.exports = new IssueRepository();
