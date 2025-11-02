import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../material.module';

/**
 * Confirm dialog data interface
 */
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
}

/**
 * Reusable confirm dialog component
 *
 * @description Enterprise-ready confirmation dialog
 * Configurable title, message, and button text
 * Returns boolean result to the caller
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button
        mat-raised-button
        [color]="data.confirmColor || 'warn'"
        (click)="onConfirm()">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    mat-dialog-content {
      padding: 20px 0;
      min-width: 300px;
    }

    mat-dialog-content p {
      margin: 0;
      line-height: 1.5;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  /**
   * Handle confirm action
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
