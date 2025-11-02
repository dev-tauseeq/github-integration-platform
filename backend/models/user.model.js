const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  login: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String
  },
  email: {
    type: String,
    index: true
  },
  avatarUrl: {
    type: String
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  type: {
    type: String,
    enum: ['User', 'Organization', 'Bot']
  },
  siteAdmin: {
    type: Boolean,
    default: false
  },
  company: {
    type: String
  },
  blog: {
    type: String
  },
  location: {
    type: String
  },
  bio: {
    type: String
  },
  twitterUsername: {
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
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ integrationId: 1, login: 1 });
userSchema.index({ integrationId: 1, githubId: 1 }, { unique: true, sparse: true }); // Prevent duplicates
userSchema.index({ organizationId: 1, login: 1 });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ type: 1 }); // For filtering by user type
userSchema.index({ syncedAt: -1 });
userSchema.index({ integrationId: 1, syncedAt: -1 }); // For retention policy

const User = mongoose.model('User', userSchema);

module.exports = User;
