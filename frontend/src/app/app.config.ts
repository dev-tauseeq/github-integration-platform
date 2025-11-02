import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';

/**
 * Application configuration
 *
 * @description Configures Angular application with all necessary providers
 * - HTTP interceptors for auth, error handling, loading, and logging
 * - Routing configuration
 * - Animations
 * - Zone.js change detection optimization
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,       // Adds auth token to requests
        errorInterceptor,      // Handles errors globally
        loadingInterceptor,    // Manages loading state
        loggingInterceptor     // Logs HTTP traffic (dev only)
      ])
    ),
    provideAnimations()
  ]
};
