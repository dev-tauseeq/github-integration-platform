import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { GitHubApiService } from './github-api.service';
import { IntegrationStatus, OAuthInitResponse } from '../../features/integration/models/integration.model';
import { User } from '../models/user.model';
import { LoggerService } from './logger.service';

/**
 * GitHub Integration Facade
 *
 * @description Provides a unified interface for GitHub integration operations
 * Coordinates between AuthService, TokenService, and GitHubApiService
 * Implements the Facade pattern to simplify complex subsystem interactions
 */
@Injectable({
  providedIn: 'root'
})
export class GitHubIntegrationFacade {
  private integrationStatusSubject = new BehaviorSubject<IntegrationStatus>({
    connected: false
  });

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private githubApiService: GitHubApiService,
    private logger: LoggerService
  ) {
    this.initializeStatus();
  }

  /**
   * Observable for integration status
   */
  get integrationStatus$(): Observable<IntegrationStatus> {
    return this.integrationStatusSubject.asObservable();
  }

  /**
   * Get current integration status
   */
  get currentStatus(): IntegrationStatus {
    return this.integrationStatusSubject.value;
  }

  /**
   * Check if user is connected to GitHub
   */
  isConnected(): boolean {
    return this.integrationStatusSubject.value.connected;
  }

  /**
   * Initiate GitHub OAuth connection
   */
  initiateConnection(): Observable<OAuthInitResponse> {
    this.logger.info('Initiating GitHub connection flow');
    return this.githubApiService.initiateOAuth();
  }

  /**
   * Handle OAuth callback with token
   */
  handleOAuthCallback(token: string): Observable<boolean> {
    this.logger.group('Handling OAuth callback');

    // Store the token
    this.tokenService.setToken(token);

    // Verify the token
    return this.githubApiService.verifyToken(token).pipe(
      map(response => {
        if (response.valid && response.user) {
          const user: User = {
            userId: response.user.userId,
            username: response.user.username,
            email: response.user.email,
            name: response.user.name,
            avatarUrl: response.user.avatarUrl
          };

          this.authService.setUser(user);
          this.refreshStatus();
          this.logger.info('OAuth callback handled successfully');
          this.logger.groupEnd();
          return true;
        }

        this.logger.warn('OAuth callback verification failed');
        this.logger.groupEnd();
        return false;
      }),
      catchError(error => {
        this.logger.error('Error in OAuth callback', error);
        this.authService.clearAuthData();
        this.logger.groupEnd();
        return of(false);
      })
    );
  }

  /**
   * Check and refresh integration status
   */
  refreshStatus(): void {
    const userId = this.authService.getUserId();

    this.githubApiService.checkStatus(userId || undefined).subscribe(
      status => {
        this.integrationStatusSubject.next(status);
        this.logger.debug('Integration status refreshed', status);
      },
      error => {
        this.logger.error('Error refreshing integration status', error);
        this.integrationStatusSubject.next({ connected: false });
      }
    );
  }

  /**
   * Disconnect from GitHub
   */
  disconnect(): Observable<void> {
    this.logger.info('Disconnecting from GitHub');

    return this.githubApiService.disconnect().pipe(
      tap(() => {
        this.authService.clearAuthData();
        this.integrationStatusSubject.next({ connected: false });
        this.logger.info('GitHub disconnected successfully');
      })
    );
  }

  /**
   * Start data synchronization
   */
  startSync(): Observable<void> {
    this.logger.info('Starting data synchronization');
    return this.githubApiService.startSync();
  }

  /**
   * Logout user
   */
  logout(): void {
    this.logger.info('Logging out user');

    this.disconnect().subscribe({
      next: () => this.logger.info('Logout successful'),
      error: error => this.logger.error('Error during logout', error)
    });
  }

  /**
   * Initialize integration status on service creation
   */
  private initializeStatus(): void {
    if (this.authService.isAuthenticated()) {
      this.refreshStatus();
    }
  }
}
