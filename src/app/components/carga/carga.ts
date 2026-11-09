import { Component, input, output } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';

// Esqueleto mientras carga una pantalla de los portales, o el error con "Reintentar"
@Component({
  selector: 'app-carga',
  standalone: true,
  imports: [MessageModule, SkeletonModule],
  template: `
    @if (error()) {
      <p-message severity="error" class="block w-full">
        <span class="flex flex-wrap items-center gap-3">
          {{ error() }}
          <button type="button" class="cursor-pointer font-semibold underline" (click)="reintentar.emit()">Reintentar</button>
        </span>
      </p-message>
    } @else {
      <div class="flex flex-col gap-4" aria-busy="true" aria-label="Cargando">
        <p-skeleton width="45%" height="2rem" />
        <p-skeleton height="11rem" styleClass="rounded-xl!" />
        <p-skeleton height="6rem" styleClass="rounded-xl!" />
      </div>
    }
  `,
})
export class CargaComponent {
  readonly error = input<string | null>(null);
  readonly reintentar = output<void>();
}
