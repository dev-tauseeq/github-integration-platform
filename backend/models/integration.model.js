const mongoose = require('mongoose');
const cryptoHelper = require('../helpers/crypto.helper');

const integrationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    profileUrl: {
      type: String,
      default: null,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    tokenType: {
      type: String,
      default: 'Bearer',
    },
    scope: {
      type: String,
      required: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'completed', 'failed'],
      default: 'idle',
    },
    syncProgress: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      message: { type: String, default: '' },
    },
    metadata: {
      organizations: [
        {
          id: Number,
          login: String,
          name: String,
          syncedAt: Date,
        },
      ],
      totalRepos: { type: Number, default: 0 },
      totalCommits: { type: Number, default: 0 },
      totalIssues: { type: Number, default: 0 },
      totalPulls: { type: Number, default: 0 },
      totalUsers: { type: Number, default: 0 },
      lastError: {
        message: String,
        code: String,
        timestamp: Date,
      },
    },
    rateLimitInfo: {
      limit: { type: Number, default: 5000 },
      remaining: { type: Number, default: 5000 },
      reset: { type: Date, default: null },
      used: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
integrationSchema.index({ userId: 1 });
integrationSchema.index({ username: 1 });
integrationSchema.index({ isActive: 1 });
integrationSchema.index({ connectedAt: -1 });

// Virtual for checking if sync is needed (24 hours)
integrationSchema.virtual('needsSync').get(function () {
  if (!this.lastSyncAt) return true;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.lastSyncAt < oneDayAgo;
});

// Pre-save hook to encrypt tokens
integrationSchema.pre('save', function (next) {
  if (this.isModified('accessToken') && !this.accessToken.startsWith('encrypted:')) {
    this.accessToken = 'encrypted:' + cryptoHelper.encrypt(this.accessToken);
  }
  if (this.isModified('refreshToken') && this.refreshToken && !this.refreshToken.startsWith('encrypted:')) {
    this.refreshToken = 'encrypted:' + cryptoHelper.encrypt(this.refreshToken);
  }
  next();
});

// Pre-update hook to encrypt tokens
integrationSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.accessToken && !update.accessToken.startsWith('encrypted:')) {
    update.accessToken = 'encrypted:' + cryptoHelper.encrypt(update.accessToken);
  }
  if (update.refreshToken && !update.refreshToken.startsWith('encrypted:')) {
    update.refreshToken = 'encrypted:' + cryptoHelper.encrypt(update.refreshToken);
  }

  next();
});

// Method to decrypt access token
integrationSchema.methods.getDecryptedAccessToken = function () {
  if (!this.accessToken) return null;
  if (this.accessToken.startsWith('encrypted:')) {
    return cryptoHelper.decrypt(this.accessToken.replace('encrypted:', ''));
  }
  return this.accessToken;
};

// Method to decrypt refresh token
integrationSchema.methods.getDecryptedRefreshToken = function () {
  if (!this.refreshToken) return null;
  if (this.refreshToken.startsWith('encrypted:')) {
    return cryptoHelper.decrypt(this.refreshToken.replace('encrypted:', ''));
  }
  return this.refreshToken;
};

// Method to update sync status
integrationSchema.methods.updateSyncStatus = function (status, progress = null, error = null) {
  this.syncStatus = status;

  if (progress) {
    this.syncProgress = { ...this.syncProgress, ...progress };
  }

  if (status === 'completed') {
    this.lastSyncAt = new Date();
  }

  if (error) {
    this.metadata.lastError = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date(),
    };
  }

  return this.save();
};

// Method to update rate limit info
integrationSchema.methods.updateRateLimit = function (rateLimitInfo) {
  this.rateLimitInfo = {
    limit: rateLimitInfo.limit || this.rateLimitInfo.limit,
    remaining: rateLimitInfo.remaining || this.rateLimitInfo.remaining,
    reset: rateLimitInfo.reset ? new Date(rateLimitInfo.reset * 1000) : this.rateLimitInfo.reset,
    used: rateLimitInfo.used || this.rateLimitInfo.used,
  };
  return this.save();
};

// Method to deactivate integration
integrationSchema.methods.deactivate = function () {
  this.isActive = false;
  this.accessToken = null;
  this.refreshToken = null;
  return this.save();
};

// Static method to find active integration by userId
integrationSchema.statics.findActiveByUserId = function (userId) {
  return this.findOne({ userId, isActive: true });
};

// Static method to find or create integration
integrationSchema.statics.findOrCreate = async function (userData) {
  let integration = await this.findOne({ userId: userData.userId });

  if (integration) {
    // Update existing integration
    Object.assign(integration, userData);
    integration.isActive = true;
    integration.connectedAt = new Date();
    await integration.save();
  } else {
    // Create new integration
    integration = await this.create(userData);
  }

  return integration;
};

// Transform for JSON output (hide sensitive data)
integrationSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.accessToken;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

const Integration = mongoose.model('Integration', integrationSchema, 'github-integration');

module.exports = Integration;