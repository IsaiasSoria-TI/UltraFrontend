import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
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
    // Pantallas internas: comparten el sidebar y se cargan bajo demanda
    path: '',
    loadComponent: () => import('./components/layout/layout').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
        {
        path: 'dashboard',
        loadComponent: () => import('./pages/login/dashboard/dashboard').then((m) => m.DashboardComponent)
        },
        {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/clientes').then((m) => m.ClientesComponent)
        }
    ]
    },
    {
    path: '**',
    redirectTo: 'dashboard'
    }
];
