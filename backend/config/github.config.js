const config = require('./environment');

const githubConfig = {
  clientID: config.github.clientId,
  clientSecret: config.github.clientSecret,
  callbackURL: config.github.callbackUrl,
  scope: ['read:org', 'repo', 'user', 'read:user', 'user:email'],

  // GitHub API configuration
  api: {
    baseURL: 'https://api.github.com',
    version: '2022-11-28', // GitHub API version
    headers: {
      Accept: 'application/vnd.github+json',
    },
  },

  // OAuth URLs
  oauth: {
    authorizeURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://github.com/login/oauth/access_token',
  },
};

module.exports = githubConfig;