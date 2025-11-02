import { Routes } from '@angular/router';
import { IntegrationPanelComponent } from './features/integration/components/integration-panel/integration-panel.component';
import { AuthCallbackComponent } from './features/integration/components/auth-callback/auth-callback.component';

export const routes: Routes = [
  { path: '', redirectTo: '/integration', pathMatch: 'full' },
  { path: 'integration', component: IntegrationPanelComponent },
  { path: 'auth/success', component: AuthCallbackComponent },
  { path: 'auth/error', component: AuthCallbackComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: '**', redirectTo: '/integration' }
];
