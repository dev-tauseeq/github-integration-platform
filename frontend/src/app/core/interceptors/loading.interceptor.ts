import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * HTTP Interceptor that manages global loading state
 *
 * @description Tracks active HTTP requests and updates the loading service
 * to show/hide loading indicators automatically
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading indicator for certain endpoints (like status checks)
  const skipLoading = req.headers.has('X-Skip-Loading') ||
                      req.url.includes('/auth/status');

  if (!skipLoading) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoading) {
        loadingService.hide();
      }
    })
  );
};
