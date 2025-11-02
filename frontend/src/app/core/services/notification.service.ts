import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { INotificationService, NotificationConfig, NotificationType } from '../interfaces/notification.interface';

/**
 * Notification service implementation using Angular Material Snackbar
 *
 * @description Provides abstraction over MatSnackBar for showing notifications
 * Implements INotificationService for easy swapping of notification libraries
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService implements INotificationService {
  private defaultConfig: NotificationConfig = {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'top'
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success notification
   */
  showSuccess(message: string, config?: NotificationConfig): void {
    this.show(message, NotificationType.SUCCESS, config);
  }

  /**
   * Show error notification
   */
  showError(message: string, config?: NotificationConfig): void {
    this.show(message, NotificationType.ERROR, {
      duration: 5000, // Errors stay longer
      ...config
    });
  }

  /**
   * Show warning notification
   */
  showWarning(message: string, config?: NotificationConfig): void {
    this.show(message, NotificationType.WARNING, config);
  }

  /**
   * Show info notification
   */
  showInfo(message: string, config?: NotificationConfig): void {
    this.show(message, NotificationType.INFO, config);
  }

  /**
   * Show notification with custom type
   */
  show(message: string, type: NotificationType, config?: NotificationConfig): void {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const panelClass = this.getPanelClass(type, mergedConfig.panelClass);

    const snackBarConfig: MatSnackBarConfig = {
      duration: mergedConfig.duration,
      horizontalPosition: mergedConfig.horizontalPosition,
      verticalPosition: mergedConfig.verticalPosition,
      panelClass
    };

    this.snackBar.open(message, 'Close', snackBarConfig);
  }

  /**
   * Dismiss all active notifications
   */
  dismissAll(): void {
    this.snackBar.dismiss();
  }

  /**
   * Get CSS class for notification type
   */
  private getPanelClass(type: NotificationType, customClass?: string | string[]): string[] {
    const baseClass = `${type}-snackbar`;
    const classes = [baseClass];

    if (customClass) {
      if (Array.isArray(customClass)) {
        classes.push(...customClass);
      } else {
        classes.push(customClass);
      }
    }

    return classes;
  }
}
