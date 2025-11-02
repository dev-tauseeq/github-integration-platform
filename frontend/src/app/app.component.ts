import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MaterialModule } from './shared/material.module';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, MaterialModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'GitHub Integration Platform';
}
