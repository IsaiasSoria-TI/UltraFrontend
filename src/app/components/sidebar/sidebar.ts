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
  readonly sections: SidebarSection[] = [
    {
      titulo: 'Principal',
      items: [{ icon: 'pi pi-th-large', label: 'Dashboard', route: '/dashboard', disponible: true }],
    },
    {
      titulo: 'Operaciones',
      items: [
        { icon: 'pi pi-users', label: 'Clientes', route: '/clientes', disponible: true },
        { icon: 'pi pi-id-card', label: 'Membresías', route: '/membresias', disponible: false },
        { icon: 'pi pi-shopping-cart', label: 'Ventas', route: '/ventas', disponible: false },
        { icon: 'pi pi-wallet', label: 'Caja', route: '/caja', disponible: false },
        { icon: 'pi pi-truck', label: 'Compras', route: '/compras', disponible: false },
      ],
    },
    {
      titulo: 'Administración',
      items: [
        { icon: 'pi pi-tags', label: 'Planes', route: '/planes', disponible: false },
        { icon: 'pi pi-box', label: 'Productos', route: '/productos', disponible: false },
        { icon: 'pi pi-building', label: 'Proveedores', route: '/proveedores', disponible: false },
        { icon: 'pi pi-percentage', label: 'Impuestos', route: '/impuestos', disponible: false },
        { icon: 'pi pi-user-edit', label: 'Usuarios y roles', route: '/usuarios', disponible: false },
        { icon: 'pi pi-chart-bar', label: 'Reportes', route: '/reportes', disponible: false },
      ],
    },
  ];

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
