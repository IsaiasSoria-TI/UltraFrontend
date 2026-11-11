import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PortalClienteStore } from '../../../services/portal-cliente.store';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { CargaComponent } from '../../../components/carga/carga';
import { FotoPerfilEditorComponent } from '../../../components/foto-perfil-editor/foto-perfil-editor';
import { PerfilService } from '../../../services/perfil.service';
import { nombreDocumento } from '../../../utils/documento';
import { nombreCompleto } from '../../../utils/membresia-estado';

@Component({
  selector: 'app-portal-perfil',
  standalone: true,
  imports: [DatePipe, RouterLink, CargaComponent, FotoPerfilEditorComponent],
  templateUrl: './perfil.html',
})
export class PortalPerfilComponent {
  protected readonly store = inject(PortalClienteStore);
  protected readonly theme = inject(ThemeService);
  protected readonly perfil = inject(PerfilService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly nombreDocumento = nombreDocumento;
  protected readonly nombreCompleto = nombreCompleto;

  protected salir(): void {
    this.auth.logout();
    void this.router.navigate(['/acceso-cliente']);
  }
}
