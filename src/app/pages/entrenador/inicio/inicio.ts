import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EntrenadorService } from '../../../services/entrenador.service';
import { ResumenEntrenador } from '../../../models/entrenador.model';
import { CargaComponent } from '../../../components/carga/carga';
import { FilaClienteComponent } from '../../../components/fila-cliente/fila-cliente';
import { mensajeError } from '../../../utils/http-error';
import { textoUltimoControl } from '../detalle-cliente';

@Component({
  selector: 'app-entrenador-inicio',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, CargaComponent, FilaClienteComponent],
  templateUrl: './inicio.html',
})
export class EntrenadorInicioComponent {
  private readonly service = inject(EntrenadorService);

  protected readonly hoy = new Date();
  protected readonly resumen = signal<ResumenEntrenador | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly textoUltimoControl = textoUltimoControl;
  protected readonly primerNombre = computed(() => this.resumen()?.nombre.split(' ')[0] ?? '');

  constructor() {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.error.set(null);
    try {
      this.resumen.set(await firstValueFrom(this.service.resumen()));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo cargar tu resumen. Inténtalo de nuevo.'));
    }
  }
}
