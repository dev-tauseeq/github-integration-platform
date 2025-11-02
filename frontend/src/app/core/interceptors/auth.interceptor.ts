import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

/**
 * HTTP Interceptor that adds authentication token to outgoing requests
 *
 * @description Automatically injects the JWT token from storage into the Authorization header
 * for all HTTP requests to the API
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const token = storageService.getItem('auth_token');

  // Skip adding token for authentication endpoints
  if (req.url.includes('/auth/github') || req.url.includes('/auth/callback')) {
    return next(req);
  }

  // Clone and add authorization header if token exists
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
