const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema({
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
  sha: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  author: {
    name: String,
    email: String,
    date: Date,
    login: String,
    avatarUrl: String
  },
  committer: {
    name: String,
    email: String,
    date: Date,
    login: String,
    avatarUrl: String
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  commentCount: {
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
  totalChanges: {
    type: Number,
    default: 0
  },
  files: [{
    filename: String,
    status: String,
    additions: Number,
    deletions: Number,
    changes: Number
  }],
  parents: [{
    sha: String,
    url: String
  }],
  verified: {
    type: Boolean,
    default: false
  },
  signature: {
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
commitSchema.index({ integrationId: 1, repoId: 1 });
commitSchema.index({ repoId: 1, 'author.date': -1 });
commitSchema.index({ 'author.email': 1 });
commitSchema.index({ syncedAt: -1 });

const Commit = mongoose.model('Commit', commitSchema);

module.exports = Commit;
