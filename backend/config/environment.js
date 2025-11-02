require('dotenv').config();

const config = {
  // Server Configuration
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/integrations',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    },
  },

  // GitHub OAuth Configuration
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
    scope: 'read:org repo user',
  },

  // Security Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    expiresIn: '7d',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default_32_char_encryption_key__',
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:4200',
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validation
const validateConfig = () => {
  const required = [];

  if (config.env === 'production') {
    if (!config.github.clientId) required.push('GITHUB_CLIENT_ID');
    if (!config.github.clientSecret) required.push('GITHUB_CLIENT_SECRET');
    if (config.jwt.secret === 'default_jwt_secret_change_in_production') required.push('JWT_SECRET');
    if (config.encryption.key === 'default_32_char_encryption_key__') required.push('ENCRYPTION_KEY');
  }

  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
};

validateConfig();

module.exports = config;