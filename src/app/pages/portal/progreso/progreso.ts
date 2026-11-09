import { Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PortalClienteStore } from '../../../services/portal-cliente.store';
import { GraficoPesoComponent } from '../../../components/grafico-peso/grafico-peso';
import { CargaComponent } from '../../../components/carga/carga';

@Component({
  selector: 'app-portal-progreso',
  standalone: true,
  imports: [DatePipe, DecimalPipe, GraficoPesoComponent, CargaComponent],
  templateUrl: './progreso.html',
})
export class PortalProgresoComponent {
  protected readonly store = inject(PortalClienteStore);

  // Los controles llegan del más reciente al más antiguo
  protected readonly resumen = computed(() => {
    const c = this.store.datos()?.controles ?? [];
    if (!c.length) return null;
    const actual = c[0].peso;
    const inicial = c[c.length - 1].peso;
    return { actual, inicial, variacion: actual - inicial };
  });
}
