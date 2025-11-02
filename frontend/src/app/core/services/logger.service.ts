import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Logger service for centralized logging
 *
 * @description Provides structured logging with different levels
 * Can be extended to send logs to external services
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isDevelopment: boolean;

  constructor() {
    // Check if we're in development mode
    this.isDevelopment = !environment.production;
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${this.timestamp()} ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${this.timestamp()} ${message}`, ...args);
  }

  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${this.timestamp()} ${message}`, ...args);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${this.timestamp()} ${message}`, ...args);
    }
  }

  /**
   * Log HTTP request/response
   */
  logHttp(request: string, response: string, timing: string): void {
    if (this.isDevelopment) {
      console.log(
        `[HTTP] ${this.timestamp()}\n  Request: ${request}\n  Response: ${response}\n  ${timing}`
      );
    }
  }

  /**
   * Log HTTP error
   */
  logHttpError(request: string, error: any, timing: string): void {
    console.error(
      `[HTTP ERROR] ${this.timestamp()}\n  Request: ${request}\n  ${timing}`,
      error
    );
  }

  /**
   * Get current timestamp
   */
  private timestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Group logs (for complex operations)
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(`[GROUP] ${this.timestamp()} ${label}`);
    }
  }

  /**
   * End group logs
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Log table data (useful for arrays of objects)
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }
}
