import { Component, computed, input } from '@angular/core';
import { CLASES_ESTADO, EstadoVisual } from '../../utils/membresia-estado';

// Etiqueta de estado de la membresía (Activa, Por vencer, Programada, Vencida, Cancelada)
@Component({
  selector: 'app-estado-membresia',
  standalone: true,
  template: `<span class="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold" [class]="clases()">{{ estado() }}</span>`,
})
export class EstadoMembresiaComponent {
  readonly estado = input.required<EstadoVisual>();
  protected readonly clases = computed(() => CLASES_ESTADO[this.estado()]);
}
