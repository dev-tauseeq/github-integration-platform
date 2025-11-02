const mongoose = require('mongoose');

const repoSchema = new mongoose.Schema({
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Integration',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  githubId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String
  },
  private: {
    type: Boolean,
    default: false
  },
  fork: {
    type: Boolean,
    default: false
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  cloneUrl: {
    type: String
  },
  gitUrl: {
    type: String
  },
  sshUrl: {
    type: String
  },
  homepage: {
    type: String
  },
  language: {
    type: String,
    index: true
  },
  size: {
    type: Number,
    default: 0
  },
  stargazersCount: {
    type: Number,
    default: 0,
    index: true
  },
  watchersCount: {
    type: Number,
    default: 0
  },
  forksCount: {
    type: Number,
    default: 0
  },
  openIssuesCount: {
    type: Number,
    default: 0
  },
  defaultBranch: {
    type: String,
    default: 'main'
  },
  topics: [{
    type: String
  }],
  hasIssues: {
    type: Boolean,
    default: true
  },
  hasProjects: {
    type: Boolean,
    default: true
  },
  hasWiki: {
    type: Boolean,
    default: true
  },
  hasPages: {
    type: Boolean,
    default: false
  },
  hasDownloads: {
    type: Boolean,
    default: true
  },
  archived: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'internal']
  },
  pushedAt: {
    type: Date
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  owner: {
    login: String,
    avatarUrl: String,
    type: String
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
repoSchema.index({ integrationId: 1, fullName: 1 });
repoSchema.index({ organizationId: 1, name: 1 });
repoSchema.index({ integrationId: 1, private: 1 }); // For filtering private/public
repoSchema.index({ integrationId: 1, archived: 1 }); // For filtering archived repos
repoSchema.index({ language: 1, stargazersCount: -1 });
repoSchema.index({ syncedAt: -1 });
repoSchema.index({ integrationId: 1, syncedAt: -1 }); // For retention policy
repoSchema.index({ pushedAt: -1 }); // For recently updated repos
repoSchema.index({ createdAt: -1 }); // For recently created repos

const Repo = mongoose.model('Repo', repoSchema);

module.exports = Repo;
