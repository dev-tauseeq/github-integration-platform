const BaseRepository = require('./base.repository');
const Commit = require('../models/commit.model');

class CommitRepository extends BaseRepository {
  constructor() {
    super(Commit);
  }

  async findByRepoId(repoId, options = {}) {
    return await this.find({ repoId }, {}, options);
  }

  async findBySha(sha) {
    return await this.findOne({ sha });
  }

  async upsertBySha(sha, data) {
    return await this.upsert({ sha }, data);
  }

  async findByAuthorEmail(email, options = {}) {
    return await this.find({ 'author.email': email }, {}, options);
  }

  async findByRepoAndDateRange(repoId, startDate, endDate) {
    return await this.find({
      repoId,
      'author.date': {
        $gte: startDate,
        $lte: endDate
      }
    }, {}, { sort: { 'author.date': -1 } });
  }

  async countByRepo(repoId) {
    return await this.count({ repoId });
  }

  async getCommitStatsByRepo(repoId) {
    return await this.aggregate([
      { $match: { repoId } },
      {
        $group: {
          _id: '$repoId',
          totalCommits: { $sum: 1 },
          totalAdditions: { $sum: '$additions' },
          totalDeletions: { $sum: '$deletions' },
          authors: { $addToSet: '$author.email' }
        }
      }
    ]);
  }

  async findTopCommitters(repoId, limit = 10) {
    return await this.aggregate([
      { $match: { repoId } },
      {
        $group: {
          _id: '$author.email',
          name: { $first: '$author.name' },
          login: { $first: '$author.login' },
          commitCount: { $sum: 1 },
          totalAdditions: { $sum: '$additions' },
          totalDeletions: { $sum: '$deletions' }
        }
      },
      { $sort: { commitCount: -1 } },
      { $limit: limit }
    ]);
  }
}

module.exports = new CommitRepository();
