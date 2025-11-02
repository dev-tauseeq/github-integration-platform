import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { GitHubIntegrationFacade } from '../../../core/services/github-integration.facade';
import { IntegrationStatus } from '../models/integration.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfigService } from '../../../core/services/config.service';
import { LoadingService } from '../../../core/services/loading.service';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Integration service for managing GitHub integration UI operations
 *
 * @description Orchestrates integration operations and manages UI state
 * Uses facade pattern to interact with core services
 * Separated from direct service dependencies for better testability
 */
@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  private syncProgress$ = new BehaviorSubject<SyncProgress | null>(null);

  constructor(
    private integrationFacade: GitHubIntegrationFacade,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private loadingService: LoadingService,
    private logger: LoggerService
  ) {}

  /**
   * Get loading state
   */
  getLoadingState(): Observable<boolean> {
    return this.loadingService.isLoading$;
  }

  /**
   * Get sync progress
   */
  getSyncProgress(): Observable<SyncProgress | null> {
    return this.syncProgress$.asObservable();
  }

  /**
   * Connect to GitHub
   */
  connectGitHub(): void {
    this.logger.info('Initiating GitHub connection');

    this.integrationFacade.initiateConnection().subscribe({
      next: (response) => {
        this.logger.info('Redirecting to GitHub OAuth');
        // Redirect to GitHub OAuth
        window.location.href = response.authUrl;
      },
      error: (error) => {
        this.notificationService.showError('Failed to initiate GitHub connection');
        this.logger.error('Connection error', error);
      }
    });
  }

  /**
   * Disconnect from GitHub
   */
  disconnectGitHub(): Observable<void> {
    this.logger.info('Disconnecting from GitHub');

    return new Observable(observer => {
      this.integrationFacade.disconnect().subscribe({
        next: () => {
          this.notificationService.showSuccess('Successfully disconnected from GitHub');
          this.logger.info('Disconnected successfully');
          observer.next();
          observer.complete();
        },
        error: (error) => {
          this.notificationService.showError('Failed to disconnect from GitHub');
          this.logger.error('Disconnect error', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Re-sync GitHub data
   */
  resyncData(): void {
    this.logger.info('Starting data resync');
    this.syncProgress$.next({ current: 0, total: 100, message: 'Starting sync...' });

    this.integrationFacade.startSync().subscribe({
      next: () => {
        this.notificationService.showSuccess('Sync started successfully');
        this.pollSyncStatus();
      },
      error: (error) => {
        this.syncProgress$.next(null);
        this.notificationService.showError('Failed to start sync');
        this.logger.error('Sync error', error);
      }
    });
  }

  /**
   * Poll sync status until complete
   */
  private pollSyncStatus(): void {
    const pollInterval = this.configService.sync.pollInterval;

    interval(pollInterval)
      .pipe(
        switchMap(() => {
          this.integrationFacade.refreshStatus();
          return this.integrationFacade.integrationStatus$;
        }),
        takeWhile((status: IntegrationStatus) => {
          // Update progress
          if (status.syncStatus === 'syncing' && status.metadata) {
            const progress: SyncProgress = {
              current: status.metadata.totalRepos || 0,
              total: 100, // This should come from backend
              message: 'Syncing repositories...'
            };
            this.syncProgress$.next(progress);
          }

          // Check if sync is complete or failed
          if (status.syncStatus === 'completed') {
            this.syncProgress$.next(null);
            this.notificationService.showSuccess('Sync completed successfully!');
            this.logger.info('Sync completed');
            return false; // Stop polling
          }

          if (status.syncStatus === 'failed') {
            this.syncProgress$.next(null);
            this.notificationService.showError('Sync failed. Please try again.');
            this.logger.error('Sync failed');
            return false; // Stop polling
          }

          return status.syncStatus === 'syncing'; // Continue polling
        }, true)
      )
      .subscribe();
  }

  /**
   * Handle OAuth callback
   */
  handleOAuthCallback(token: string): Observable<boolean> {
    this.logger.info('Handling OAuth callback');

    return new Observable(observer => {
      this.integrationFacade.handleOAuthCallback(token).subscribe({
        next: (success) => {
          if (success) {
            this.notificationService.showSuccess('Successfully connected to GitHub!');
            this.logger.info('OAuth callback successful');
            observer.next(true);
          } else {
            this.notificationService.showError('Failed to verify GitHub connection');
            this.logger.warn('OAuth verification failed');
            observer.next(false);
          }
          observer.complete();
        },
        error: (error) => {
          this.notificationService.showError('Authentication failed');
          this.logger.error('OAuth callback error', error);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  /**
   * Refresh integration status
   */
  refreshStatus(): Observable<IntegrationStatus> {
    this.integrationFacade.refreshStatus();
    return this.integrationFacade.integrationStatus$;
  }
}

/**
 * Sync progress interface
 */
interface SyncProgress {
  current: number;
  total: number;
  message: string;
}