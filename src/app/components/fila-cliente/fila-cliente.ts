import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClienteAsignado } from '../../models/entrenador.model';
import { EstadoMembresiaComponent } from '../estado-membresia/estado-membresia';
import { estadoVisual, iniciales, nombreCompleto } from '../../utils/membresia-estado';

// Cliente en las listas del entrenador: enlaza a su ficha
@Component({
  selector: 'app-fila-cliente',
  standalone: true,
  imports: [RouterLink, EstadoMembresiaComponent],
  template: `
    @let c = cliente();
    <a [routerLink]="['/entrenador/clientes', c.id]"
      class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none dark:hover:bg-zinc-800/60 dark:focus-visible:bg-zinc-800/60">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300" aria-hidden="true">{{ iniciales() }}</span>
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">{{ nombre() }}</span>
        <span class="truncate text-xs text-gray-500 dark:text-zinc-400">{{ detalle() }}</span>
      </span>
      @if (estado(); as e) {
        <app-estado-membresia [estado]="e" />
      }
      <i class="pi pi-chevron-right text-xs! text-gray-400" aria-hidden="true"></i>
    </a>
  `,
})
export class FilaClienteComponent {
  readonly cliente = input.required<ClienteAsignado>();
  readonly detalle = input('');

  protected readonly nombre = computed(() => nombreCompleto(this.cliente()));
  protected readonly iniciales = computed(() => iniciales(this.cliente()));
  protected readonly estado = computed(() => {
    const m = this.cliente().membresia;
    return m ? estadoVisual(m) : null;
  });
}
