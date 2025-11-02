import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Loading service for managing global loading state
 *
 * @description Tracks active requests and provides observable for loading state
 * Useful for showing/hiding global loading indicators
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private activeRequests = 0;

  /**
   * Observable for loading state
   */
  get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  /**
   * Get current loading state
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Show loading indicator
   */
  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Hide loading indicator
   */
  hide(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Force hide loading (reset counter)
   */
  forceHide(): void {
    this.activeRequests = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Get active request count
   */
  getActiveRequestCount(): number {
    return this.activeRequests;
  }
}
