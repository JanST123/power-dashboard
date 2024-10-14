import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  {
    component: DashboardComponent,
    path: 'Dashboard'
  },
  {
    path: '**',
    redirectTo: 'Dashboard'
  }
];
