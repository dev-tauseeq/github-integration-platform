import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';
import { Router } from '@angular/router';

/**
 * HTTP Interceptor that handles errors globally
 *
 * @description Catches HTTP errors and delegates to ErrorHandlerService for
 * centralized error handling, logging, and user notification
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different error types
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network Error: ${error.error.message}`;
      } else {
        // Backend returned an unsuccessful response code
        switch (error.status) {
          case 401:
            errorMessage = 'Unauthorized. Please login again.';
            // Clear auth data and redirect to login
            router.navigate(['/integration']);
            break;
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 500:
            errorMessage = 'Internal server error';
            break;
          case 503:
            errorMessage = 'Service unavailable';
            break;
          default:
            errorMessage = error.error?.message || error.message || errorMessage;
        }
      }

      // Delegate to error handler service
      errorHandler.handleError({
        message: errorMessage,
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined,
        originalError: error
      });

      return throwError(() => error);
    })
  );
};
