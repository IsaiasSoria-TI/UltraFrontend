import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/login/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
    },

    {
    path: 'login',
    component: LoginComponent
    },
    {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
    }
];
