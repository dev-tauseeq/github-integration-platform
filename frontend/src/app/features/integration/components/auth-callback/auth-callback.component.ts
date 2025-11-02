import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material.module';
import { ActivatedRoute, Router } from '@angular/router';
import { IntegrationService } from '../../services/integration.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss']
})
export class AuthCallbackComponent implements OnInit {
  isProcessing = true;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private integrationService: IntegrationService
  ) {}

  ngOnInit(): void {
    this.handleCallback();
  }

  private handleCallback(): void {
    // Check for success callback with token
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.handleSuccess(token);
      return;
    }

    // Check for error callback
    const error = this.route.snapshot.queryParamMap.get('error');
    const errorMessage = this.route.snapshot.queryParamMap.get('message');
    if (error || errorMessage) {
      this.handleError(errorMessage || error || 'Authentication failed');
      return;
    }

    // No token or error, something went wrong
    this.handleError('Invalid callback parameters');
  }

  private handleSuccess(token: string): void {
    this.integrationService.handleOAuthCallback(token).subscribe(
      (success) => {
        this.isProcessing = false;
        this.isSuccess = success;

        if (success) {
          // Redirect to integration page after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/integration']);
          }, 2000);
        } else {
          this.errorMessage = 'Failed to verify authentication';
        }
      },
      (error) => {
        this.isProcessing = false;
        this.isSuccess = false;
        this.errorMessage = 'Authentication failed';
        console.error('OAuth callback error:', error);
      }
    );
  }

  private handleError(message: string): void {
    this.isProcessing = false;
    this.isSuccess = false;
    this.errorMessage = decodeURIComponent(message);
  }

  tryAgain(): void {
    this.router.navigate(['/integration']);
  }
}