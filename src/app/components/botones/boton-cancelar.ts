import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/** Cierra un diálogo o formulario sin guardar. Nunca envía el formulario. */
@Component({
  selector: 'app-boton-cancelar',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <button pButton type="button" severity="secondary" [outlined]="true" (click)="clic.emit()">
      {{ texto() }}
    </button>
  `,
})
export class BotonCancelarComponent {
  readonly texto = input('Cancelar');
  readonly clic = output<void>();
}
