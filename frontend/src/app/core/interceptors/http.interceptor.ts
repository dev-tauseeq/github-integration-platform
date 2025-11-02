import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor as AngularHttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class HttpInterceptor implements AngularHttpInterceptor {
  private totalRequests = 0;

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.totalRequests++;

    // Show loading indicator
    this.setLoading(true);

    // Clone the request to add headers
    let modifiedRequest = request.clone({
      setHeaders: this.getHeaders()
    });

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      modifiedRequest = modifiedRequest.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(modifiedRequest).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Handle successful responses
          this.handleSuccessResponse(event);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Handle errors
        return this.handleErrorResponse(error);
      }),
      finalize(() => {
        this.totalRequests--;
        if (this.totalRequests === 0) {
          this.setLoading(false);
        }
      })
    );
  }

  private getHeaders(): { [name: string]: string } {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private getAuthToken(): string | null {
    // Retrieve token from localStorage or sessionStorage
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  private handleSuccessResponse(response: HttpResponse<any>): void {
    // Log successful responses in development
    if (response.body && console && console.group) {
      console.group(`✅ ${response.status} ${response.url}`);
      console.log('Response:', response.body);
      console.groupEnd();
    }
  }

  private handleErrorResponse(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;

      // Handle specific error codes
      switch (error.status) {
        case 401:
          // Unauthorized - redirect to login
          this.handleUnauthorized();
          break;
        case 403:
          // Forbidden
          this.handleForbidden();
          break;
        case 404:
          // Not found
          errorMessage = 'Resource not found';
          break;
        case 500:
          // Internal server error
          errorMessage = 'Internal server error. Please try again later.';
          break;
        case 0:
          // Network error
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
    }

    // Log error in development
    if (console && console.error) {
      console.error(`❌ API Error:`, errorMessage);
      console.error('Full error object:', error);
    }

    return throwError(() => error);
  }

  private handleUnauthorized(): void {
    // Clear stored tokens
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');

    // Redirect to login page
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  private handleForbidden(): void {
    // Navigate to access denied page or show message
    console.warn('Access forbidden to this resource');
  }

  private setLoading(loading: boolean): void {
    // Implement loading indicator logic
    // This could emit to a loading service or update a store
    if (loading) {
      // Show loading indicator
      document.body.classList.add('loading');
    } else {
      // Hide loading indicator
      document.body.classList.remove('loading');
    }
  }
}

// Provider for the interceptor
export const httpInterceptorProvider = {
  provide: 'HTTP_INTERCEPTORS',
  useClass: HttpInterceptor,
  multi: true
};