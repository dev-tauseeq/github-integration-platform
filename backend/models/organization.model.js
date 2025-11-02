const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Integration',
    required: true,
    index: true
  },
  githubId: {
    type: Number,
    required: true,
    unique: true
  },
  login: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  location: {
    type: String
  },
  email: {
    type: String
  },
  publicRepos: {
    type: Number,
    default: 0
  },
  publicGists: {
    type: Number,
    default: 0
  },
  followers: {
    type: Number,
    default: 0
  },
  following: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  type: {
    type: String,
    enum: ['Organization', 'User']
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
organizationSchema.index({ integrationId: 1, login: 1 });
organizationSchema.index({ syncedAt: -1 });

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
