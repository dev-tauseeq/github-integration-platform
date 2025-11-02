import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppConfig } from '../models/config.model';

/**
 * Configuration service for managing application settings
 *
 * @description Centralizes all configuration and provides type-safe access
 * Combines environment variables with default configuration
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Get full configuration
   */
  getConfig(): Readonly<AppConfig> {
    return this.config;
  }

  /**
   * Get API configuration
   */
  get api() {
    return this.config.api;
  }

  /**
   * Get Auth configuration
   */
  get auth() {
    return this.config.auth;
  }

  /**
   * Get Sync configuration
   */
  get sync() {
    return this.config.sync;
  }

  /**
   * Get UI configuration
   */
  get ui() {
    return this.config.ui;
  }

  /**
   * Get feature flags
   */
  get features() {
    return this.config.features;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Load configuration from environment and defaults
   */
  private loadConfig(): AppConfig {
    return {
      api: {
        baseUrl: environment.apiUrl || 'http://localhost:3000/api',
        timeout: environment.apiTimeout || 30000,
        retryAttempts: 3,
        retryDelay: 1000
      },
      auth: {
        tokenKey: 'auth_token',
        userIdKey: 'user_id',
        usernameKey: 'username',
        emailKey: 'email',
        tokenExpiryBuffer: 5 // 5 minutes
      },
      sync: {
        pollInterval: 2000, // 2 seconds
        maxRetries: 3,
        batchSize: 100,
        enableAutoSync: true
      },
      ui: {
        defaultPageSize: 50,
        notificationDuration: 3000,
        errorNotificationDuration: 5000,
        loadingDebounce: 300
      },
      features: {
        enableAdvancedSearch: true,
        enableDataExport: true,
        enableRealTimeSync: false,
        enableNotifications: true
      }
    };
  }

  /**
   * Override configuration (useful for testing)
   */
  overrideConfig(partialConfig: Partial<AppConfig>): void {
    Object.assign(this.config, partialConfig);
  }
}
