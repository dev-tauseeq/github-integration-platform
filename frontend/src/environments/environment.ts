export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'GitHub Integration',
  appVersion: '1.0.0',
  github: {
    clientId: 'your_github_client_id',
    redirectUri: 'http://localhost:4200/auth/callback'
  },
  features: {
    enableLogging: true,
    enableDebugMode: true
  }
};