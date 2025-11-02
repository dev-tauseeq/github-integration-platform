import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  IntegrationStatus,
  OAuthInitResponse,
  AuthResponse
} from '../../features/integration/models/integration.model';

@Injectable({
  providedIn: 'root'
})
export class GitHubService {
  private integrationStatus$ = new BehaviorSubject<IntegrationStatus>({ connected: false });
  private authToken$ = new BehaviorSubject<string | null>(null);

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {
    this.loadStoredToken();
    this.checkIntegrationStatus();
  }

  /**
   * Get the current integration status as an observable
   */
  getIntegrationStatus(): Observable<IntegrationStatus> {
    return this.integrationStatus$.asObservable();
  }

  /**
   * Get the current integration status value
   */
  getCurrentStatus(): IntegrationStatus {
    return this.integrationStatus$.value;
  }

  /**
   * Check if user is connected
   */
  isConnected(): boolean {
    return this.integrationStatus$.value.connected;
  }

  /**
   * Initiate GitHub OAuth connection
   */
  initiateConnection(): Observable<OAuthInitResponse> {
    return this.apiService.get<any>('/auth/github').pipe(
      map(response => response.data as OAuthInitResponse)
    );
  }

  /**
   * Check the current integration status from the backend
   */
  checkIntegrationStatus(): Observable<IntegrationStatus> {
    const token = this.getStoredToken();
    const userId = this.getStoredUserId();

    let url = '/auth/status';
    if (userId) {
      url += `?userId=${userId}`;
    }

    return this.apiService.get<any>(url).pipe(
      map(response => response.data as IntegrationStatus),
      tap(status => {
        this.integrationStatus$.next(status);
      }),
      catchError(error => {
        console.error('Error checking integration status:', error);
        this.integrationStatus$.next({ connected: false });
        return of({ connected: false });
      })
    );
  }

  /**
   * Remove GitHub integration
   */
  removeIntegration(): Observable<any> {
    return this.apiService.delete<any>('/auth/disconnect').pipe(
      tap(() => {
        this.integrationStatus$.next({ connected: false });
        this.clearStoredData();
      })
    );
  }

  /**
   * Re-sync GitHub data
   */
  resyncIntegration(): Observable<any> {
    return this.apiService.post<any>('/sync/all', {});
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): Observable<any> {
    return this.apiService.get<any>(`/auth/verify?token=${token}`);
  }

  /**
   * Get current user info
   */
  getCurrentUser(): Observable<any> {
    return this.apiService.get<any>('/auth/me');
  }

  /**
   * Get integration statistics
   */
  getStatistics(): Observable<any> {
    return this.apiService.get<any>('/auth/statistics');
  }

  /**
   * Handle OAuth callback
   */
  handleOAuthCallback(token: string): Observable<boolean> {
    // Store the token
    this.storeToken(token);

    // Verify the token
    return this.verifyToken(token).pipe(
      map(response => {
        if (response.data?.valid && response.data?.user) {
          this.storeUserData(response.data.user);
          this.checkIntegrationStatus().subscribe();
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('Error verifying token:', error);
        this.clearStoredData();
        return of(false);
      })
    );
  }

  /**
   * Store authentication token
   */
  private storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.authToken$.next(token);
  }

  /**
   * Get stored token
   */
  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Store user data
   */
  private storeUserData(user: any): void {
    localStorage.setItem('user_id', user.userId);
    localStorage.setItem('username', user.username);
    if (user.email) {
      localStorage.setItem('email', user.email);
    }
  }

  /**
   * Get stored user ID
   */
  private getStoredUserId(): string | null {
    return localStorage.getItem('user_id');
  }

  /**
   * Load stored token on service initialization
   */
  private loadStoredToken(): void {
    const token = this.getStoredToken();
    if (token) {
      this.authToken$.next(token);
    }
  }

  /**
   * Clear all stored data
   */
  clearStoredData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    this.authToken$.next(null);
    this.integrationStatus$.next({ connected: false });
  }

  /**
   * Logout user
   */
  logout(): void {
    this.removeIntegration().subscribe(
      () => {
        console.log('Successfully disconnected from GitHub');
      },
      error => {
        console.error('Error disconnecting:', error);
      }
    );
    this.clearStoredData();
  }
}