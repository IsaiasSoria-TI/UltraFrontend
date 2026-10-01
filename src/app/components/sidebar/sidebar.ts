import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

interface SidebarItem {
  icon: string;
  label: string;
  route: string;
  // false mientras la pantalla aún no existe
  disponible: boolean;
}

interface SidebarSection {
  titulo: string;
  items: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AvatarModule, TagModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);

  readonly username = this.authService.getUsername();
  readonly rol = this.authService.getRol();
  readonly iniciales = this.username.slice(0, 2).toUpperCase();

  // Opciones tomadas del diagrama de casos de uso (Recepcionista y Administrador)
  private readonly todasLasSecciones: SidebarSection[] = [
    {
      titulo: 'Principal',
      items: [{ icon: 'pi pi-th-large', label: 'Dashboard', route: '/dashboard', disponible: true }],
    },
    {
      titulo: 'Operaciones',
      items: [
        { icon: 'pi pi-users', label: 'Clientes', route: '/clientes', disponible: true },
        { icon: 'pi pi-id-card', label: 'Membresías', route: '/membresias', disponible: true },
        { icon: 'pi pi-shopping-cart', label: 'Ventas', route: '/ventas', disponible: true },
        { icon: 'pi pi-wallet', label: 'Caja', route: '/caja', disponible: true },
        { icon: 'pi pi-truck', label: 'Compras', route: '/compras', disponible: true },
      ],
    },
    {
      titulo: 'Administración',
      items: [
        { icon: 'pi pi-tags', label: 'Planes', route: '/planes', disponible: true },
        { icon: 'pi pi-box', label: 'Productos', route: '/productos', disponible: true },
        { icon: 'pi pi-building', label: 'Proveedores', route: '/proveedores', disponible: true },
        { icon: 'pi pi-percentage', label: 'Impuestos', route: '/impuestos', disponible: true },
        { icon: 'pi pi-user-edit', label: 'Usuarios y roles', route: '/usuarios', disponible: true },
        { icon: 'pi pi-chart-bar', label: 'Reportes', route: '/reportes', disponible: true },
      ],
    },
  ];

  // Administración solo la ve el administrador (el backend también lo restringe)
  readonly sections = this.authService.esAdministrador()
    ? this.todasLasSecciones
    : this.todasLasSecciones.filter((s) => s.titulo !== 'Administración');

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
