import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/** Acción secundaria con borde (Buscar, Agregar, Filtrar...). Con [peligro] va en rojo (Anular). */
@Component({
  selector: 'app-boton-secundario',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <button pButton [type]="tipo()" [severity]="peligro() ? 'danger' : 'secondary'" [outlined]="true"
      [disabled]="cargando() || deshabilitado()" (click)="clic.emit()">
      @if (cargando()) {
        <i class="pi pi-spinner pi-spin" aria-hidden="true"></i>
      } @else if (icono()) {
        <i [class]="icono()" aria-hidden="true"></i>
      }
      {{ texto() }}
    </button>
  `,
})
export class BotonSecundarioComponent {
  readonly texto = input.required<string>();
  readonly icono = input<string>();
  readonly cargando = input(false);
  readonly deshabilitado = input(false);
  readonly peligro = input(false);
  readonly tipo = input<'button' | 'submit'>('button');
  readonly clic = output<void>();
}
