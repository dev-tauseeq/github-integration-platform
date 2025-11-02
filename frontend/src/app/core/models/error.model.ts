/**
 * Application error model
 */
export interface AppError {
  message: string;
  status?: number;
  statusText?: string;
  url?: string;
  timestamp?: Date;
  originalError?: any;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Structured error for logging and tracking
 */
export interface StructuredError extends AppError {
  severity: ErrorSeverity;
  context?: Record<string, any>;
  stackTrace?: string;
}
