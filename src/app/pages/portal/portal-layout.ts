import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OpcionPortal, PortalShellComponent } from '../../components/portal-shell/portal-shell';
import { PortalClienteStore } from '../../services/portal-cliente.store';

// Portal del cliente: todas sus pantallas comparten los datos de GET /portal
@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, PortalShellComponent],
  providers: [PortalClienteStore],
  template: `
    <app-portal-shell [opciones]="opciones" [iniciales]="store.iniciales()" rutaPerfil="/portal/perfil">
      <router-outlet />
    </app-portal-shell>
  `,
})
export class PortalLayoutComponent {
  protected readonly store = inject(PortalClienteStore);

  protected readonly opciones: OpcionPortal[] = [
    { label: 'Inicio', ruta: '/portal', icono: 'pi pi-home', exacta: true },
    { label: 'Membresía', ruta: '/portal/membresia', icono: 'pi pi-id-card' },
    { label: 'Progreso', ruta: '/portal/progreso', icono: 'pi pi-chart-line' },
    { label: 'Perfil', ruta: '/portal/perfil', icono: 'pi pi-user' },
  ];

  constructor() {
    void this.store.cargar();
  }
}
