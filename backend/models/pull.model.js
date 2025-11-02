const mongoose = require('mongoose');

const pullSchema = new mongoose.Schema({
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Integration',
    required: true,
    index: true
  },
  repoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repo',
    required: true,
    index: true
  },
  githubId: {
    type: Number,
    required: true
  },
  number: {
    type: Number,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String
  },
  state: {
    type: String,
    enum: ['open', 'closed'],
    required: true,
    index: true
  },
  locked: {
    type: Boolean,
    default: false
  },
  user: {
    login: String,
    avatarUrl: String,
    type: String
  },
  labels: [{
    name: String,
    color: String,
    description: String
  }],
  milestone: {
    title: String,
    number: Number,
    state: String
  },
  assignees: [{
    login: String,
    avatarUrl: String
  }],
  requestedReviewers: [{
    login: String,
    avatarUrl: String
  }],
  head: {
    ref: String,
    sha: String,
    label: String,
    user: {
      login: String,
      avatarUrl: String
    }
  },
  base: {
    ref: String,
    sha: String,
    label: String
  },
  draft: {
    type: Boolean,
    default: false
  },
  merged: {
    type: Boolean,
    default: false,
    index: true
  },
  mergeable: {
    type: Boolean
  },
  mergedBy: {
    login: String,
    avatarUrl: String
  },
  comments: {
    type: Number,
    default: 0
  },
  reviewComments: {
    type: Number,
    default: 0
  },
  commits: {
    type: Number,
    default: 0
  },
  additions: {
    type: Number,
    default: 0
  },
  deletions: {
    type: Number,
    default: 0
  },
  changedFiles: {
    type: Number,
    default: 0
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  diffUrl: {
    type: String
  },
  patchUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    index: true
  },
  updatedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  mergedAt: {
    type: Date,
    index: true
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for performance
pullSchema.index({ integrationId: 1, repoId: 1 });
pullSchema.index({ repoId: 1, number: 1 }, { unique: true });
pullSchema.index({ repoId: 1, state: 1, createdAt: -1 });
pullSchema.index({ integrationId: 1, state: 1, updatedAt: -1 }); // For filtering by state
pullSchema.index({ integrationId: 1, merged: 1, mergedAt: -1 }); // For merged PRs
pullSchema.index({ 'user.login': 1, state: 1 });
pullSchema.index({ 'assignees.login': 1 }); // For assignee queries
pullSchema.index({ 'head.sha': 1 }); // For commit-based queries
pullSchema.index({ 'base.ref': 1 }); // For branch queries
pullSchema.index({ syncedAt: -1 });
pullSchema.index({ integrationId: 1, syncedAt: -1 }); // For retention policy
pullSchema.index({ mergedAt: 1 }, { sparse: true }); // For merged PR queries

const Pull = mongoose.model('Pull', pullSchema);

module.exports = Pull;
