import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { ConfigService } from './config.service';

/**
 * Token management service
 *
 * @description Handles secure token storage, retrieval, and validation
 * Separated from auth logic for better modularity
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private storageService: StorageService,
    private configService: ConfigService
  ) {
    this.loadToken();
  }

  /**
   * Observable for token changes
   */
  get token$(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  /**
   * Get current token
   */
  get token(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return !!this.token;
  }

  /**
   * Store authentication token
   */
  setToken(token: string): void {
    const tokenKey = this.configService.auth.tokenKey;
    this.storageService.setItem(tokenKey, token);
    this.tokenSubject.next(token);
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    const tokenKey = this.configService.auth.tokenKey;
    return this.storageService.getItem(tokenKey);
  }

  /**
   * Remove token
   */
  clearToken(): void {
    const tokenKey = this.configService.auth.tokenKey;
    this.storageService.removeItem(tokenKey);
    this.tokenSubject.next(null);
  }

  /**
   * Load token from storage on initialization
   */
  private loadToken(): void {
    const token = this.getToken();
    if (token) {
      this.tokenSubject.next(token);
    }
  }

  /**
   * Check if token is expired (basic check)
   * Note: Implement JWT decode if using JWT tokens
   */
  isTokenExpired(): boolean {
    const token = this.token;
    if (!token) return true;

    // TODO: Implement JWT token expiry check
    // For now, assume token is valid
    return false;
  }

  /**
   * Refresh token if needed
   */
  shouldRefreshToken(): boolean {
    // Implement logic to check if token should be refreshed
    // Based on expiry time minus buffer
    return false;
  }
}
