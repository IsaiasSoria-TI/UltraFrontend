import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { clienteGuard, contrasenaGuard, entrenadorGuard, personalGuard, sesionGuard } from './guards/rol.guard';

export const routes: Routes = [
    {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
    },

    {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent)
    },
    {
    // Públicas: login de clientes por documento y página del enlace de WhatsApp
    path: 'acceso-cliente',
    loadComponent: () => import('./pages/acceso-cliente/acceso-cliente').then((m) => m.AccesoClienteComponent)
    },
    {
    path: 'activar',
    loadComponent: () => import('./pages/activar/activar').then((m) => m.ActivarComponent)
    },
    {
    // Cambio de contraseña: obligatorio si es temporal, o voluntario desde el perfil
    path: 'cambiar-contrasena',
    loadComponent: () =>
        import('./pages/cambiar-contrasena/cambiar-contrasena').then((m) => m.CambiarContrasenaComponent),
    canActivate: [sesionGuard]
    },
    {
    // Portal del cliente (después de /acceso-cliente)
    path: 'portal',
    loadComponent: () => import('./pages/portal/portal-layout').then((m) => m.PortalLayoutComponent),
    canActivate: [clienteGuard, contrasenaGuard],
    children: [
        {
        path: '',
        loadComponent: () => import('./pages/portal/inicio/inicio').then((m) => m.PortalInicioComponent)
        },
        {
        path: 'membresia',
        loadComponent: () => import('./pages/portal/membresia/membresia').then((m) => m.PortalMembresiaComponent)
        },
        {
        path: 'progreso',
        loadComponent: () => import('./pages/portal/progreso/progreso').then((m) => m.PortalProgresoComponent)
        },
        {
        path: 'perfil',
        loadComponent: () => import('./pages/portal/perfil/perfil').then((m) => m.PortalPerfilComponent)
        }
    ]
    },
    {
    // Portal del entrenador: sus clientes asignados y sus controles de peso
    path: 'entrenador',
    loadComponent: () => import('./pages/entrenador/entrenador-layout').then((m) => m.EntrenadorLayoutComponent),
    canActivate: [entrenadorGuard, contrasenaGuard],
    children: [
        {
        path: '',
        loadComponent: () => import('./pages/entrenador/inicio/inicio').then((m) => m.EntrenadorInicioComponent)
        },
        {
        path: 'clientes',
        loadComponent: () => import('./pages/entrenador/clientes/clientes').then((m) => m.EntrenadorClientesComponent)
        },
        {
        path: 'clientes/:id',
        loadComponent: () => import('./pages/entrenador/cliente/cliente').then((m) => m.EntrenadorClienteComponent)
        },
        {
        path: 'clientes/:id/control',
        loadComponent: () =>
            import('./pages/entrenador/registrar-control/registrar-control').then((m) => m.RegistrarControlComponent)
        },
        {
        path: 'controles',
        loadComponent: () => import('./pages/entrenador/controles/controles').then((m) => m.EntrenadorControlesComponent)
        },
        {
        path: 'perfil',
        loadComponent: () => import('./pages/entrenador/perfil/perfil').then((m) => m.EntrenadorPerfilComponent)
        }
    ]
    },
    {
    // Pantallas internas: comparten el sidebar y se cargan bajo demanda
    path: '',
    loadComponent: () => import('./components/layout/layout').then((m) => m.LayoutComponent),
    canActivate: [authGuard, personalGuard, contrasenaGuard],
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
