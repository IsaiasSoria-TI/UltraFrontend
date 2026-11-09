import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EntrenadorService } from '../../../services/entrenador.service';
import { ControlRegistrado } from '../../../models/entrenador.model';
import { CargaComponent } from '../../../components/carga/carga';
import { mensajeError } from '../../../utils/http-error';

type Periodo = 'semana' | 'mes' | 'todos';

const PERIODOS: { valor: Periodo; etiqueta: string }[] = [
  { valor: 'semana', etiqueta: 'Últimos 7 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'todos', etiqueta: 'Todos' },
];

function desde(periodo: Periodo, ahora = new Date()): number {
  if (periodo === 'semana') return ahora.getTime() - 7 * 86_400_000;
  if (periodo === 'mes') return new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
  return 0;
}

// Controles que registró el entrenador (los más recientes primero)
@Component({
  selector: 'app-entrenador-controles',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, CargaComponent],
  templateUrl: './controles.html',
})
export class EntrenadorControlesComponent {
  private readonly service = inject(EntrenadorService);

  protected readonly controles = signal<ControlRegistrado[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly periodo = signal<Periodo>('mes');
  protected readonly periodos = PERIODOS;

  protected readonly cantidades = computed(() => {
    const lista = this.controles() ?? [];
    return Object.fromEntries(
      PERIODOS.map((p) => [p.valor, lista.filter((c) => new Date(c.fecha).getTime() >= desde(p.valor)).length]),
    ) as Record<Periodo, number>;
  });

  protected readonly visibles = computed(() => {
    const limite = desde(this.periodo());
    return (this.controles() ?? []).filter((c) => new Date(c.fecha).getTime() >= limite);
  });

  constructor() {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.error.set(null);
    try {
      this.controles.set(await firstValueFrom(this.service.controles()));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo cargar tus controles. Inténtalo de nuevo.'));
    }
  }
}
