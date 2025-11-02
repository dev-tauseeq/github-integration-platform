import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * HTTP options interface for flexible request configuration
 */
export interface HttpOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  observe?: 'body' | 'response';
  params?: HttpParams | { [param: string]: string | string[] };
  reportProgress?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // GET request
  get<T>(endpoint: string, params?: HttpParams | { [param: string]: string | string[] }): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // POST request
  post<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        catchError(this.handleError)
      );
  }

  // PUT request
  put<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        catchError(this.handleError)
      );
  }

  // PATCH request
  patch<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        catchError(this.handleError)
      );
  }

  // DELETE request
  delete<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, options)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Upload file
  upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Observable<T> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData, {
      reportProgress: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Download file
  download(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Build query params
  buildParams(params: any): HttpParams {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        if (Array.isArray(params[key])) {
          params[key].forEach((item: any) => {
            httpParams = httpParams.append(key, item);
          });
        } else {
          httpParams = httpParams.append(key, params[key]);
        }
      }
    });

    return httpParams;
  }

  // Error handler
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error('API Error:', errorMessage);
    return throwError(() => ({
      error: error.error,
      message: errorMessage,
      status: error.status
    }));
  }

  // Get full URL
  getFullUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }
}