import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/** Acción menor sin borde y pequeña (Cambiar, atajos de rango). */
@Component({
  selector: 'app-boton-texto',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <button pButton type="button" size="small" severity="secondary" [text]="true" (click)="clic.emit()">
      {{ texto() }}
    </button>
  `,
})
export class BotonTextoComponent {
  readonly texto = input.required<string>();
  readonly clic = output<void>();
}
