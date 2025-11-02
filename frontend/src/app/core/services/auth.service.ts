import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { TokenService } from './token.service';
import { StorageService } from './storage.service';
import { ConfigService } from './config.service';
import { User, StoredUserData } from '../models/user.model';
import { LoggerService } from './logger.service';

/**
 * Authentication service
 *
 * @description Handles user authentication, user data management
 * Separated from token management and API calls for better modularity
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private tokenService: TokenService,
    private storageService: StorageService,
    private configService: ConfigService,
    private logger: LoggerService
  ) {
    this.initializeAuth();
  }

  /**
   * Observable for current user
   */
  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Observable for authentication status
   */
  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  /**
   * Get current user value
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Set authenticated user
   */
  setUser(user: User): void {
    this.storeUserData(user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    this.logger.info(`User authenticated: ${user.username}`);
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    const userIdKey = this.configService.auth.userIdKey;
    return this.storageService.getItem(userIdKey);
  }

  /**
   * Get username
   */
  getUsername(): string | null {
    const usernameKey = this.configService.auth.usernameKey;
    return this.storageService.getItem(usernameKey);
  }

  /**
   * Get user email
   */
  getEmail(): string | null {
    const emailKey = this.configService.auth.emailKey;
    return this.storageService.getItem(emailKey);
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.logger.info('User logged out');
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    this.tokenService.clearToken();
    this.clearUserData();
  }

  /**
   * Initialize authentication state
   */
  private initializeAuth(): void {
    const token = this.tokenService.getToken();
    if (token) {
      const user = this.loadStoredUser();
      if (user) {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        this.logger.info('Authentication state restored from storage');
      }
    }
  }

  /**
   * Store user data in storage
   */
  private storeUserData(user: User): void {
    const { userIdKey, usernameKey, emailKey } = this.configService.auth;

    this.storageService.setItem(userIdKey, user.userId);
    this.storageService.setItem(usernameKey, user.username);

    if (user.email) {
      this.storageService.setItem(emailKey, user.email);
    }
  }

  /**
   * Load stored user data
   */
  private loadStoredUser(): User | null {
    const { userIdKey, usernameKey, emailKey } = this.configService.auth;

    const userId = this.storageService.getItem(userIdKey);
    const username = this.storageService.getItem(usernameKey);
    const email = this.storageService.getItem(emailKey);

    if (!userId || !username) {
      return null;
    }

    return {
      userId,
      username,
      email: email || undefined
    };
  }

  /**
   * Clear user data from storage
   */
  private clearUserData(): void {
    const { userIdKey, usernameKey, emailKey } = this.configService.auth;

    this.storageService.removeItem(userIdKey);
    this.storageService.removeItem(usernameKey);
    this.storageService.removeItem(emailKey);
  }
}
