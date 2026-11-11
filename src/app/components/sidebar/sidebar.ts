import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { PerfilService } from '../../services/perfil.service';

interface SidebarItem {
  icon: string;
  label: string;
  route: string;
  // false mientras la pantalla aún no existe
  disponible: boolean;
  soloAdministrador?: boolean;
}

interface SidebarSection {
  titulo: string;
  items: SidebarItem[];
}

// Categorías que el usuario dejó plegadas (preferencia de este navegador)
const SECCIONES_CERRADAS_KEY = 'sidebar_secciones_cerradas';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TagModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);
  // Color del gimnasio, modo y foto del usuario con sesión
  protected readonly perfil = inject(PerfilService);

  // Solo aplican en móvil/tablet: en escritorio el sidebar siempre está visible
  readonly abierto = input(false);
  readonly movil = input(false);
  readonly cerrar = output<void>();

  readonly username = this.authService.getUsername();
  readonly rol = this.authService.getRol();
  readonly iniciales = this.username.slice(0, 2).toUpperCase();

  // Opciones tomadas del diagrama de casos de uso (Recepcionista y Administrador)
  private readonly todasLasSecciones: SidebarSection[] = [
    {
      titulo: 'General',
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
        { icon: 'pi pi-tags', label: 'Planes', route: '/planes', disponible: true, soloAdministrador: true },
        { icon: 'pi pi-box', label: 'Productos', route: '/productos', disponible: true, soloAdministrador: true },
        { icon: 'pi pi-building', label: 'Proveedores', route: '/proveedores', disponible: true, soloAdministrador: true },
        { icon: 'pi pi-percentage', label: 'Impuestos', route: '/impuestos', disponible: true, soloAdministrador: true },
        { icon: 'pi pi-user-edit', label: 'Usuarios y roles', route: '/usuarios', disponible: true, soloAdministrador: true },
        { icon: 'pi pi-chart-bar', label: 'Reportes', route: '/reportes', disponible: true, soloAdministrador: true },
      ],
    },
    {
      titulo: 'Personalización',
      items: [
        // El color de marca es de todo el gimnasio: solo lo cambia el administrador
        { icon: 'pi pi-palette', label: 'Gimnasio', route: '/personalizacion/gimnasio', disponible: true, soloAdministrador: true },
        { icon: 'pi pi-user', label: 'Mi perfil', route: '/personalizacion/perfil', disponible: true },
      ],
    },
  ];

  // Lo exclusivo del administrador solo lo ve él (el backend y las rutas también lo restringen)
  readonly sections: SidebarSection[] = this.todasLasSecciones
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.soloAdministrador || this.authService.esAdministrador()) }))
    .filter((s) => s.items.length > 0);

  protected readonly cerradas = signal<ReadonlySet<string>>(leerCerradas());

  constructor() {
    this.perfil.asegurarCargado();
    // La categoría de la pantalla actual siempre queda desplegada
    this.abrirSeccionDe(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((e) => this.abrirSeccionDe(e.urlAfterRedirects));
  }

  protected estaAbierta(titulo: string): boolean {
    return !this.cerradas().has(titulo);
  }

  protected alternar(titulo: string): void {
    const cerradas = new Set(this.cerradas());
    if (cerradas.has(titulo)) cerradas.delete(titulo);
    else cerradas.add(titulo);
    this.guardarCerradas(cerradas);
  }

  private abrirSeccionDe(url: string): void {
    const ruta = url.split(/[?#]/)[0];
    const seccion = this.sections.find((s) => s.items.some((i) => ruta === i.route || ruta.startsWith(i.route + '/')));
    if (seccion && this.cerradas().has(seccion.titulo)) {
      const cerradas = new Set(this.cerradas());
      cerradas.delete(seccion.titulo);
      this.guardarCerradas(cerradas);
    }
  }

  private guardarCerradas(cerradas: Set<string>): void {
    this.cerradas.set(cerradas);
    try {
      localStorage.setItem(SECCIONES_CERRADAS_KEY, JSON.stringify([...cerradas]));
    } catch {
      // sin almacenamiento: el estado dura solo esta sesión
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

function leerCerradas(): ReadonlySet<string> {
  try {
    const guardadas = JSON.parse(localStorage.getItem(SECCIONES_CERRADAS_KEY) ?? '[]');
    return new Set(Array.isArray(guardadas) ? guardadas.filter((t) => typeof t === 'string') : []);
  } catch {
    return new Set();
  }
}
