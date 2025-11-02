import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  IntegrationStatus,
  OAuthInitResponse
} from '../../features/integration/models/integration.model';
import { LoggerService } from './logger.service';

/**
 * Response wrapper interface
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Verification response interface
 */
interface VerificationResponse {
  valid: boolean;
  user?: {
    userId: string;
    username: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
}

/**
 * Statistics response interface
 */
interface Statistics {
  totalRepos: number;
  totalCommits: number;
  totalIssues: number;
  totalPulls: number;
  totalUsers: number;
  lastSyncAt?: Date;
}

/**
 * GitHub API service
 *
 * @description Handles all GitHub-specific API calls
 * Separated from auth and token management for better modularity
 * Uses ApiService for HTTP calls with proper typing
 */
@Injectable({
  providedIn: 'root'
})
export class GitHubApiService {
  constructor(
    private apiService: ApiService,
    private logger: LoggerService
  ) {}

  /**
   * Initiate GitHub OAuth connection
   */
  initiateOAuth(): Observable<OAuthInitResponse> {
    this.logger.info('Initiating GitHub OAuth flow');

    return this.apiService.get<ApiResponse<OAuthInitResponse>>('/auth/github').pipe(
      map(response => response.data),
      tap(() => this.logger.info('OAuth URL retrieved successfully'))
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): Observable<VerificationResponse> {
    this.logger.info('Verifying authentication token');

    return this.apiService.get<ApiResponse<VerificationResponse>>(
      `/auth/verify?token=${token}`
    ).pipe(
      map(response => response.data),
      tap(result => {
        if (result.valid) {
          this.logger.info('Token verified successfully');
        } else {
          this.logger.warn('Token verification failed');
        }
      })
    );
  }

  /**
   * Check integration status
   */
  checkStatus(userId?: string): Observable<IntegrationStatus> {
    let url = '/auth/status';
    if (userId) {
      url += `?userId=${userId}`;
    }

    return this.apiService.get<ApiResponse<IntegrationStatus>>(url).pipe(
      map(response => response.data),
      catchError(error => {
        this.logger.error('Error checking integration status', error);
        return of({ connected: false } as IntegrationStatus);
      })
    );
  }

  /**
   * Disconnect GitHub integration
   */
  disconnect(): Observable<void> {
    this.logger.info('Disconnecting GitHub integration');

    return this.apiService.delete<ApiResponse<void>>('/auth/disconnect').pipe(
      map(() => undefined),
      tap(() => this.logger.info('GitHub integration disconnected'))
    );
  }

  /**
   * Start data synchronization
   */
  startSync(): Observable<void> {
    this.logger.info('Starting GitHub data synchronization');

    return this.apiService.post<ApiResponse<void>>('/sync/all', {}).pipe(
      map(() => undefined),
      tap(() => this.logger.info('Sync initiated successfully'))
    );
  }

  /**
   * Get current user info from GitHub
   */
  getCurrentUser(): Observable<any> {
    return this.apiService.get<ApiResponse<any>>('/auth/me').pipe(
      map(response => response.data)
    );
  }

  /**
   * Get integration statistics
   */
  getStatistics(): Observable<Statistics> {
    return this.apiService.get<ApiResponse<Statistics>>('/auth/statistics').pipe(
      map(response => response.data)
    );
  }
}
