import { Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PortalClienteStore } from '../../../services/portal-cliente.store';
import { GraficoPesoComponent } from '../../../components/grafico-peso/grafico-peso';
import { CargaComponent } from '../../../components/carga/carga';
import { PerimetrosControlComponent } from '../../../components/perimetros-control/perimetros-control';
import { perimetrosMedidos } from '../../../utils/perimetros';

@Component({
  selector: 'app-portal-progreso',
  standalone: true,
  imports: [DatePipe, DecimalPipe, GraficoPesoComponent, CargaComponent, PerimetrosControlComponent],
  templateUrl: './progreso.html',
})
export class PortalProgresoComponent {
  protected readonly store = inject(PortalClienteStore);

  // Cada control con sus perímetros y la variación de cada uno respecto a su medida anterior
  protected readonly historial = computed(() => {
    const controles = this.store.datos()?.controles ?? [];
    return controles.map((c, i) => ({ ...c, medidos: perimetrosMedidos(controles, i) }));
  });

  // Los controles llegan del más reciente al más antiguo
  protected readonly resumen = computed(() => {
    const c = this.store.datos()?.controles ?? [];
    if (!c.length) return null;
    const actual = c[0].peso;
    const inicial = c[c.length - 1].peso;
    return { actual, inicial, variacion: actual - inicial };
  });
}
