import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material.module';
import { ConnectionStatusComponent } from '../connection-status/connection-status.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GitHubIntegrationFacade } from '../../../../core/services/github-integration.facade';
import { IntegrationService } from '../../services/integration.service';
import { IntegrationStatus } from '../../models/integration.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-integration-panel',
  standalone: true,
  imports: [CommonModule, MaterialModule, ConnectionStatusComponent],
  templateUrl: './integration-panel.component.html',
  styleUrls: ['./integration-panel.component.scss']
})
export class IntegrationPanelComponent implements OnInit, OnDestroy {
  integrationStatus: IntegrationStatus | null = null;
  isLoading = false;
  syncProgress: any = null;
  panelOpenState = false;
  private destroy$ = new Subject<void>();

  constructor(
    private integrationFacade: GitHubIntegrationFacade,
    private integrationService: IntegrationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.subscribeToStatus();
    this.subscribeToLoadingState();
    this.subscribeTSyncProgress();
    this.refreshStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToStatus(): void {
    this.integrationFacade.integrationStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.integrationStatus = status;
      });
  }

  private subscribeToLoadingState(): void {
    this.integrationService.getLoadingState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.isLoading = isLoading;
      });
  }

  private subscribeTSyncProgress(): void {
    this.integrationService.getSyncProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.syncProgress = progress;
      });
  }

  refreshStatus(): void {
    this.integrationService.refreshStatus().subscribe();
  }

  connectGitHub(): void {
    this.integrationService.connectGitHub();
  }

  disconnectGitHub(): void {
    // Show confirmation dialog
    const dialogData: ConfirmDialogData = {
      title: 'Disconnect GitHub Integration',
      message: 'Are you sure you want to disconnect your GitHub account? This will remove all stored tokens and you will need to reconnect to sync data again.',
      confirmText: 'Disconnect',
      cancelText: 'Cancel',
      confirmColor: 'warn'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.integrationService.disconnectGitHub().subscribe(() => {
          this.refreshStatus();
        });
      }
    });
  }

  resyncData(): void {
    this.integrationService.resyncData();
  }

  isConnected(): boolean {
    return this.integrationStatus?.connected || false;
  }

  canSync(): boolean {
    return this.isConnected() && !this.isLoading &&
           this.integrationStatus?.syncStatus !== 'syncing';
  }

  getSyncButtonText(): string {
    if (this.integrationStatus?.syncStatus === 'syncing') {
      return 'Syncing...';
    }
    return this.integrationStatus?.needsSync ? 'Sync Now' : 'Re-sync Data';
  }

  getSyncProgressText(): string {
    if (!this.syncProgress) return '';
    return `${this.syncProgress.message} (${this.syncProgress.current}/${this.syncProgress.total})`;
  }

  getSyncProgressValue(): number {
    if (!this.syncProgress) return 0;
    return (this.syncProgress.current / this.syncProgress.total) * 100;
  }
}