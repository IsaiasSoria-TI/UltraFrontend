import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PerimetroMedido } from '../../utils/perimetros';

/**
 * Perímetros de un control como etiquetas: "Cintura 82.0 cm ▼1.5". La flecha compara con la
 * medida anterior de ese perímetro; es neutra a propósito (bajar cintura y subir bíceps pueden
 * ser ambos buenos resultados).
 */
@Component({
  selector: 'app-perimetros-control',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @if (medidos().length) {
      <ul class="flex flex-wrap gap-1.5" aria-label="Perímetros">
        @for (m of medidos(); track m.clave) {
          <li class="rounded-md bg-gray-100 px-2 py-0.5 text-xs tabular-nums text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
            {{ m.etiqueta }} {{ m.valor | number: '1.1-1' }} cm
            @if (m.variacion !== null && m.variacion !== 0) {
              <span class="text-gray-500 dark:text-zinc-400" aria-hidden="true">
                {{ m.variacion > 0 ? '▲' : '▼' }}{{ abs(m.variacion) | number: '1.1-1' }}
              </span>
              <span class="sr-only">, {{ m.variacion > 0 ? 'subió' : 'bajó' }} {{ abs(m.variacion) | number: '1.1-1' }} cm</span>
            }
          </li>
        }
      </ul>
    }
  `,
})
export class PerimetrosControlComponent {
  readonly medidos = input.required<PerimetroMedido[]>();

  protected abs(valor: number): number {
    return Math.abs(valor);
  }
}
