/**
 * Application configuration model
 */
export interface AppConfig {
  api: ApiConfig;
  auth: AuthConfig;
  sync: SyncConfig;
  ui: UiConfig;
  features: FeatureFlags;
}

/**
 * API configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  tokenKey: string;
  userIdKey: string;
  usernameKey: string;
  emailKey: string;
  tokenExpiryBuffer: number; // Minutes before expiry to refresh
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  pollInterval: number; // Milliseconds
  maxRetries: number;
  batchSize: number;
  enableAutoSync: boolean;
}

/**
 * UI configuration
 */
export interface UiConfig {
  defaultPageSize: number;
  notificationDuration: number;
  errorNotificationDuration: number;
  loadingDebounce: number;
}

/**
 * Feature flags for gradual rollout
 */
export interface FeatureFlags {
  enableAdvancedSearch: boolean;
  enableDataExport: boolean;
  enableRealTimeSync: boolean;
  enableNotifications: boolean;
}
