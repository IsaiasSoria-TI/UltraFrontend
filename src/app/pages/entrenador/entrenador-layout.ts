import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { OpcionPortal, PortalShellComponent } from '../../components/portal-shell/portal-shell';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-entrenador-layout',
  standalone: true,
  imports: [RouterOutlet, PortalShellComponent, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast position="top-center" />
    <app-portal-shell [opciones]="opciones" [iniciales]="iniciales" etiqueta="Entrenador" rutaPerfil="/entrenador/perfil">
      <router-outlet />
    </app-portal-shell>
  `,
})
export class EntrenadorLayoutComponent {
  protected readonly iniciales = inject(AuthService).getUsername().slice(0, 2).toUpperCase();

  protected readonly opciones: OpcionPortal[] = [
    { label: 'Inicio', ruta: '/entrenador', icono: 'pi pi-home', exacta: true },
    { label: 'Clientes', ruta: '/entrenador/clientes', icono: 'pi pi-users' },
    { label: 'Controles', ruta: '/entrenador/controles', icono: 'pi pi-clipboard' },
    { label: 'Perfil', ruta: '/entrenador/perfil', icono: 'pi pi-user' },
  ];
}
