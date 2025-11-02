import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material.module';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GitHubIntegrationFacade } from '../../../../core/services/github-integration.facade';
import { IntegrationStatus } from '../../models/integration.model';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.scss']
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  status: IntegrationStatus | null = null;
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(private integrationFacade: GitHubIntegrationFacade) {}

  ngOnInit(): void {
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStatus(): void {
    this.integrationFacade.integrationStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.status = status;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading status:', error);
          this.isLoading = false;
        }
      });
  }

  getStatusIcon(): string {
    if (!this.status) return 'help_outline';
    return this.status.connected ? 'check_circle' : 'cancel';
  }

  getStatusColor(): string {
    if (!this.status) return 'warn';
    return this.status.connected ? 'primary' : 'warn';
  }

  getStatusText(): string {
    if (!this.status) return 'Unknown';
    if (this.status.connected) {
      return `Connected as ${this.status.username}`;
    }
    return 'Not connected';
  }

  getConnectionDate(): string {
    if (!this.status?.connectedAt) return '';
    const date = new Date(this.status.connectedAt);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getLastSyncDate(): string {
    if (!this.status?.lastSyncAt) return 'Never';
    const date = new Date(this.status.lastSyncAt);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getRateLimitText(): string {
    if (!this.status?.rateLimitInfo) return '';
    const { remaining, limit } = this.status.rateLimitInfo;
    return `${remaining} / ${limit}`;
  }

  getRateLimitPercentage(): number {
    if (!this.status?.rateLimitInfo) return 100;
    const { remaining, limit } = this.status.rateLimitInfo;
    return (remaining / limit) * 100;
  }

  getSyncStatusBadgeColor(): string {
    if (!this.status?.syncStatus) return 'primary';

    switch (this.status.syncStatus) {
      case 'syncing': return 'accent';
      case 'completed': return 'primary';
      case 'failed': return 'warn';
      default: return 'primary';
    }
  }

  getSyncStatusText(): string {
    if (!this.status?.syncStatus) return 'Idle';

    switch (this.status.syncStatus) {
      case 'syncing': return 'Syncing...';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Idle';
    }
  }
}