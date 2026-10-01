import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

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
        },
        {
        path: 'membresias',
        loadComponent: () => import('./pages/membresias/membresias').then((m) => m.MembresiasComponent)
        },
        {
        path: 'ventas',
        loadComponent: () => import('./pages/ventas/ventas').then((m) => m.VentasComponent)
        },
        {
        path: 'caja',
        loadComponent: () => import('./pages/caja/caja').then((m) => m.CajaComponent)
        },
        {
        path: 'compras',
        loadComponent: () => import('./pages/compras/compras').then((m) => m.ComprasComponent)
        },
        {
        // Administración: solo el administrador
        path: '',
        canActivateChild: [adminGuard],
        children: [
            {
            path: 'planes',
            loadComponent: () => import('./pages/planes/planes').then((m) => m.PlanesComponent)
            },
            {
            path: 'productos',
            loadComponent: () => import('./pages/productos/productos').then((m) => m.ProductosComponent)
            },
            {
            path: 'proveedores',
            loadComponent: () => import('./pages/proveedores/proveedores').then((m) => m.ProveedoresComponent)
            },
            {
            path: 'impuestos',
            loadComponent: () => import('./pages/impuestos/impuestos').then((m) => m.ImpuestosComponent)
            },
            {
            path: 'usuarios',
            loadComponent: () => import('./pages/usuarios/usuarios').then((m) => m.UsuariosComponent)
            },
            {
            path: 'reportes',
            loadComponent: () => import('./pages/reportes/reportes').then((m) => m.ReportesComponent)
            }
        ]
        }
    ]
    },
    {
    path: '**',
    redirectTo: 'dashboard'
    }
];
