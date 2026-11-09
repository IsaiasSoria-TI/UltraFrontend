import { Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

interface Punto {
  fecha: string;
  peso: number;
}

const ANCHO = 600;
const ALTO = 200;
const MARGEN = { arriba: 12, abajo: 12, izquierda: 8, derecha: 8 };

// Línea de evolución del peso. Recibe los controles del más reciente al más antiguo (como los envía el backend)
@Component({
  selector: 'app-grafico-peso',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    @if (puntos().length >= 2) {
      <figure class="flex flex-col gap-2">
        <div class="flex gap-2">
          <div class="flex flex-col justify-between py-1 text-right text-xs tabular-nums text-gray-500 dark:text-zinc-400" aria-hidden="true">
            <span>{{ escala().max | number: '1.0-1' }}</span>
            <span>{{ escala().min | number: '1.0-1' }}</span>
          </div>
          <svg [attr.viewBox]="'0 0 ' + ancho + ' ' + alto" class="h-48 w-full text-red-800 dark:text-red-400" preserveAspectRatio="none"
            role="img" [attr.aria-label]="descripcion()">
            @for (y of guias(); track y) {
              <line [attr.x1]="0" [attr.x2]="ancho" [attr.y1]="y" [attr.y2]="y" class="stroke-gray-100 dark:stroke-zinc-800" stroke-width="1" vector-effect="non-scaling-stroke" />
            }
            <polyline [attr.points]="linea()" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
          </svg>
        </div>
        <figcaption class="flex justify-between pl-8 text-xs text-gray-500 dark:text-zinc-400">
          <span>{{ puntos()[0].fecha | date: 'dd/MM' }}</span>
          <span>{{ puntos()[puntos().length - 1].fecha | date: 'dd/MM' }}</span>
        </figcaption>
      </figure>
    } @else {
      <p class="py-6 text-center text-sm text-gray-500 dark:text-zinc-400">
        El gráfico aparece cuando hay al menos dos controles.
      </p>
    }
  `,
})
export class GraficoPesoComponent {
  readonly controles = input.required<Punto[]>();

  protected readonly ancho = ANCHO;
  protected readonly alto = ALTO;

  // Del más antiguo al más reciente
  protected readonly puntos = computed(() => [...this.controles()].reverse());

  protected readonly escala = computed(() => {
    const pesos = this.puntos().map((p) => p.peso);
    let min = Math.min(...pesos);
    let max = Math.max(...pesos);
    // Un poco de aire arriba y abajo; si todos pesan lo mismo, ±1 kg
    const holgura = max === min ? 1 : (max - min) * 0.15;
    min = Math.floor((min - holgura) * 10) / 10;
    max = Math.ceil((max + holgura) * 10) / 10;
    return { min, max };
  });

  protected readonly linea = computed(() => {
    const p = this.puntos();
    const { min, max } = this.escala();
    const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
    const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
    const inicio = new Date(p[0].fecha).getTime();
    const rango = Math.max(1, new Date(p[p.length - 1].fecha).getTime() - inicio);
    return p
      .map((punto) => {
        const x = MARGEN.izquierda + ((new Date(punto.fecha).getTime() - inicio) / rango) * anchoUtil;
        const y = MARGEN.arriba + (1 - (punto.peso - min) / (max - min)) * altoUtil;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  protected readonly guias = computed(() => [MARGEN.arriba, ALTO / 2, ALTO - MARGEN.abajo]);

  protected readonly descripcion = computed(() => {
    const p = this.puntos();
    return `Peso de ${p[0].peso} kg a ${p[p.length - 1].peso} kg en ${p.length} controles`;
  });
}
