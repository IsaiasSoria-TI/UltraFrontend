import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MembresiaCliente } from '../../models/cliente.model';
import { EstadoMembresiaComponent } from '../estado-membresia/estado-membresia';
import {
  avancePeriodo,
  diasDesdeQueVencio,
  diasParaEmpezar,
  diasRestantes,
  estadoVisual,
} from '../../utils/membresia-estado';

// Tarjeta roja con la membresía del cliente: plan, estado, días y periodo
@Component({
  selector: 'app-tarjeta-membresia',
  standalone: true,
  imports: [DatePipe, EstadoMembresiaComponent],
  template: `
    @let m = membresia();
    <article class="flex h-full flex-col justify-between gap-5 rounded-xl bg-red-900 p-5 text-white shadow-sm dark:bg-red-950">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-red-100">{{ titulo() }}</p>
          <p class="truncate text-xl font-bold">{{ m.plan }}</p>
        </div>
        <app-estado-membresia [estado]="estado()" />
      </div>

      @if (numero(); as n) {
        <p class="flex items-end gap-3">
          <span class="text-6xl font-black leading-none tabular-nums">{{ n.valor }}</span>
          <span class="pb-1 text-sm text-red-100">{{ n.texto }}</span>
        </p>
      }

      <div class="flex flex-col gap-4">
        @if (estado() === 'Activa' || estado() === 'Por vencer') {
          <div class="h-2 overflow-hidden rounded-full bg-white/90" role="progressbar" aria-label="Avance de la membresía"
            aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="avance()">
            <div class="h-full rounded-full bg-amber-500" [style.width.%]="avance()"></div>
          </div>
        }
        <p class="flex justify-between gap-3 text-sm text-red-100">
          <span>{{ m.fechaInicio | date: 'dd/MM/yyyy' }}</span>
          <span>Hasta el {{ m.fechaFin | date: 'dd/MM/yyyy' }}</span>
        </p>
      </div>
    </article>
  `,
})
export class TarjetaMembresiaComponent {
  readonly membresia = input.required<MembresiaCliente>();
  readonly titulo = input('Tu membresía');

  private readonly ahora = new Date();
  protected readonly estado = computed(() => estadoVisual(this.membresia(), this.ahora));
  protected readonly avance = computed(() => Math.round(avancePeriodo(this.membresia(), this.ahora)));

  protected readonly numero = computed(() => {
    const m = this.membresia();
    switch (this.estado()) {
      case 'Programada': {
        const d = diasParaEmpezar(m, this.ahora);
        return { valor: d, texto: d === 1 ? 'día para empezar' : 'días para empezar' };
      }
      case 'Vencida': {
        const d = diasDesdeQueVencio(m, this.ahora);
        return { valor: d, texto: d === 1 ? 'día desde que venció' : 'días desde que venció' };
      }
      case 'Cancelada':
        return null;
      default: {
        const d = diasRestantes(m, this.ahora);
        return { valor: d, texto: d === 1 ? 'día restante' : 'días restantes' };
      }
    }
  });
}
