import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Acción principal de una pantalla o diálogo (Nuevo, Guardar, Confirmar...), en rojo.
 * Con [cargando] muestra el spinner y se deshabilita, así no se envía dos veces.
 */
@Component({
  selector: 'app-boton-principal',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <button pButton [type]="tipo()" [disabled]="cargando() || deshabilitado()" (click)="clic.emit()"
      class="bg-red-800! border-red-800! hover:bg-red-900! hover:border-red-900! text-white! disabled:opacity-50!">
      @if (cargando()) {
        <i class="pi pi-spinner pi-spin" aria-hidden="true"></i>
      } @else if (icono()) {
        <i [class]="icono()" aria-hidden="true"></i>
      }
      {{ texto() }}
    </button>
  `,
})
export class BotonPrincipalComponent {
  readonly texto = input.required<string>();
  readonly icono = input<string>();
  readonly cargando = input(false);
  readonly deshabilitado = input(false);
  // 'submit' solo para el botón que envía un <form> con (ngSubmit)
  readonly tipo = input<'button' | 'submit'>('button');
  readonly clic = output<void>();
}
