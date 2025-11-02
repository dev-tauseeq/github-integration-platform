const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
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
  stateReason: {
    type: String,
    enum: ['completed', 'not_planned', 'reopened', null]
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
  assignees: [{
    login: String,
    avatarUrl: String
  }],
  milestone: {
    title: String,
    number: Number,
    state: String,
    description: String
  },
  comments: {
    type: Number,
    default: 0
  },
  closedBy: {
    login: String,
    avatarUrl: String
  },
  pullRequest: {
    url: String,
    htmlUrl: String,
    diffUrl: String,
    patchUrl: String
  },
  url: {
    type: String
  },
  htmlUrl: {
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
issueSchema.index({ integrationId: 1, repoId: 1 });
issueSchema.index({ repoId: 1, number: 1 }, { unique: true });
issueSchema.index({ repoId: 1, state: 1, createdAt: -1 });
issueSchema.index({ 'user.login': 1, state: 1 });
issueSchema.index({ 'labels.name': 1 });
issueSchema.index({ syncedAt: -1 });

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
