import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

/**
 * Auth Guard for protecting routes
 *
 * @description Functional guard that checks if user is authenticated
 * Redirects to integration page if not authenticated
 * Implements modern Angular functional guard pattern
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  if (authService.isAuthenticated()) {
    logger.debug(`Access granted to route: ${state.url}`);
    return true;
  }

  logger.warn(`Access denied to route: ${state.url}. Redirecting to integration page.`);
  return router.createUrlTree(['/integration']);
};

/**
 * Guest Guard for routes that should only be accessible when not authenticated
 *
 * @description Redirects authenticated users away from guest-only routes
 * Useful for login/register pages
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  if (!authService.isAuthenticated()) {
    logger.debug(`Guest access granted to route: ${state.url}`);
    return true;
  }

  logger.warn(`Authenticated user attempting to access guest route: ${state.url}. Redirecting.`);
  return router.createUrlTree(['/integration']);
};
