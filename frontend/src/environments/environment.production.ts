export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api',
  appName: 'GitHub Integration',
  appVersion: '1.0.0',
  github: {
    clientId: 'your_production_github_client_id',
    redirectUri: 'https://yourdomain.com/auth/callback'
  },
  features: {
    enableLogging: false,
    enableDebugMode: false
  }
};