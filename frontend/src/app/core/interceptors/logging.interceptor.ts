import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

/**
 * HTTP Interceptor that logs all HTTP requests and responses
 *
 * @description Provides centralized logging for debugging and monitoring
 * HTTP traffic in the application
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const started = Date.now();

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const elapsed = Date.now() - started;
          logger.logHttp(
            `${req.method} ${req.urlWithParams}`,
            `Status: ${event.status}`,
            `Time: ${elapsed}ms`
          );
        }
      },
      error: (error) => {
        const elapsed = Date.now() - started;
        logger.logHttpError(
          `${req.method} ${req.urlWithParams}`,
          error,
          `Time: ${elapsed}ms`
        );
      }
    })
  );
};
