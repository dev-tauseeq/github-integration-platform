import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AppError, ErrorSeverity, StructuredError } from '../models/error.model';
import { NotificationService } from './notification.service';
import { LoggerService } from './logger.service';

/**
 * Centralized error handling service
 *
 * @description Manages all application errors, provides logging,
 * user notification, and error tracking capabilities
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorSubject = new Subject<StructuredError>();

  constructor(
    private notificationService: NotificationService,
    private logger: LoggerService
  ) {}

  /**
   * Observable stream of errors
   */
  get errors$(): Observable<StructuredError> {
    return this.errorSubject.asObservable();
  }

  /**
   * Handle application error
   */
  handleError(error: AppError, severity: ErrorSeverity = ErrorSeverity.ERROR, notifyUser = true): void {
    const structuredError: StructuredError = {
      ...error,
      severity,
      timestamp: new Date(),
      stackTrace: error.originalError?.stack
    };

    // Log the error
    this.logError(structuredError);

    // Emit error for subscribers
    this.errorSubject.next(structuredError);

    // Notify user if requested
    if (notifyUser) {
      this.notifyUser(structuredError);
    }
  }

  /**
   * Handle HTTP errors specifically
   */
  handleHttpError(error: AppError): void {
    const severity = this.getSeverityFromStatus(error.status);
    this.handleError(error, severity);
  }

  /**
   * Log error based on severity
   */
  private logError(error: StructuredError): void {
    switch (error.severity) {
      case ErrorSeverity.INFO:
        this.logger.info(error.message, error);
        break;
      case ErrorSeverity.WARNING:
        this.logger.warn(error.message, error);
        break;
      case ErrorSeverity.ERROR:
        this.logger.error(error.message, error);
        break;
      case ErrorSeverity.CRITICAL:
        this.logger.error(`[CRITICAL] ${error.message}`, error);
        break;
    }
  }

  /**
   * Notify user about error
   */
  private notifyUser(error: StructuredError): void {
    switch (error.severity) {
      case ErrorSeverity.INFO:
        this.notificationService.showInfo(error.message);
        break;
      case ErrorSeverity.WARNING:
        this.notificationService.showWarning(error.message);
        break;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        this.notificationService.showError(error.message);
        break;
    }
  }

  /**
   * Determine severity from HTTP status code
   */
  private getSeverityFromStatus(status?: number): ErrorSeverity {
    if (!status) return ErrorSeverity.ERROR;

    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status >= 400) return ErrorSeverity.ERROR;
    if (status >= 300) return ErrorSeverity.WARNING;
    return ErrorSeverity.INFO;
  }
}
