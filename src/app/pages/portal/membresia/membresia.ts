import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { PortalClienteStore } from '../../../services/portal-cliente.store';
import { TarjetaMembresiaComponent } from '../../../components/tarjeta-membresia/tarjeta-membresia';
import { EstadoMembresiaComponent } from '../../../components/estado-membresia/estado-membresia';
import { CargaComponent } from '../../../components/carga/carga';
import { estadoVisual } from '../../../utils/membresia-estado';

@Component({
  selector: 'app-portal-membresia',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MessageModule, TarjetaMembresiaComponent, EstadoMembresiaComponent, CargaComponent],
  templateUrl: './membresia.html',
})
export class PortalMembresiaComponent {
  protected readonly store = inject(PortalClienteStore);
  protected readonly estadoVisual = estadoVisual;

  protected readonly estadoActual = computed(() => {
    const m = this.store.datos()?.membresia;
    return m ? estadoVisual(m) : null;
  });

  // El plan de la membresía vigente se marca como "Tu plan"
  protected readonly planActual = computed(() => {
    const m = this.store.datos()?.membresia;
    return m && (m.estado === 'activo' || m.estado === 'programado') ? m.plan : null;
  });
}
