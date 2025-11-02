const mongoose = require('mongoose');

const changelogSchema = new mongoose.Schema({
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Integration',
    required: true,
    index: true
  },
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
    index: true
  },
  githubId: {
    type: Number
  },
  event: {
    type: String,
    required: true,
    index: true
  },
  actor: {
    login: String,
    avatarUrl: String,
    type: String
  },
  commitId: {
    type: String
  },
  commitUrl: {
    type: String
  },
  label: {
    name: String,
    color: String
  },
  assignee: {
    login: String,
    avatarUrl: String
  },
  milestone: {
    title: String
  },
  rename: {
    from: String,
    to: String
  },
  reviewRequester: {
    login: String,
    avatarUrl: String
  },
  requestedReviewer: {
    login: String,
    avatarUrl: String
  },
  url: {
    type: String
  },
  createdAt: {
    type: Date,
    required: true,
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
changelogSchema.index({ integrationId: 1, issueId: 1 });
changelogSchema.index({ integrationId: 1, issueId: 1, githubId: 1 }, { unique: true, sparse: true }); // Prevent duplicates
changelogSchema.index({ issueId: 1, createdAt: -1 });
changelogSchema.index({ event: 1, createdAt: -1 });
changelogSchema.index({ 'actor.login': 1 });
changelogSchema.index({ syncedAt: -1 });
changelogSchema.index({ integrationId: 1, createdAt: -1 }); // For retention policy

const Changelog = mongoose.model('Changelog', changelogSchema);

module.exports = Changelog;
