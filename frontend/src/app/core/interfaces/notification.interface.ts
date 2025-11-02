/**
 * Notification configuration interface
 */
export interface NotificationConfig {
  duration?: number;
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
  panelClass?: string | string[];
}

/**
 * Notification types
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Notification service interface
 *
 * @description Contract for notification implementations
 * Allows for easy swapping of notification libraries
 */
export interface INotificationService {
  /**
   * Show success notification
   */
  showSuccess(message: string, config?: NotificationConfig): void;

  /**
   * Show error notification
   */
  showError(message: string, config?: NotificationConfig): void;

  /**
   * Show warning notification
   */
  showWarning(message: string, config?: NotificationConfig): void;

  /**
   * Show info notification
   */
  showInfo(message: string, config?: NotificationConfig): void;

  /**
   * Show generic notification
   */
  show(message: string, type: NotificationType, config?: NotificationConfig): void;

  /**
   * Dismiss all notifications
   */
  dismissAll(): void;
}
