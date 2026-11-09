import { Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortalClienteStore } from '../../../services/portal-cliente.store';
import { TarjetaMembresiaComponent } from '../../../components/tarjeta-membresia/tarjeta-membresia';
import { CargaComponent } from '../../../components/carga/carga';

@Component({
  selector: 'app-portal-inicio',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, TarjetaMembresiaComponent, CargaComponent],
  templateUrl: './inicio.html',
})
export class PortalInicioComponent {
  protected readonly store = inject(PortalClienteStore);
  protected readonly hoy = new Date();

  // Variación entre el primer y el último control (los controles vienen del más reciente al más antiguo)
  protected readonly variacion = computed(() => {
    const c = this.store.datos()?.controles ?? [];
    return c.length >= 2 ? c[0].peso - c[c.length - 1].peso : null;
  });
}
