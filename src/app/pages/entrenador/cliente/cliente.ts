import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EntrenadorService } from '../../../services/entrenador.service';
import { DetalleClienteAsignado } from '../../../models/entrenador.model';
import { CargaComponent } from '../../../components/carga/carga';
import { EstadoMembresiaComponent } from '../../../components/estado-membresia/estado-membresia';
import { GraficoPesoComponent } from '../../../components/grafico-peso/grafico-peso';
import {
  diasDesdeQueVencio,
  diasParaEmpezar,
  diasRestantes,
  estadoVisual,
  iniciales,
  nombreCompleto,
} from '../../../utils/membresia-estado';
import { abreviaturaDocumento } from '../../../utils/documento';
import { perimetrosMedidos } from '../../../utils/perimetros';
import { PerimetrosControlComponent } from '../../../components/perimetros-control/perimetros-control';
import { esNoEncontrado, mensajeError } from '../../../utils/http-error';

// Ficha del cliente para su entrenador (ruta /entrenador/clientes/:id)
@Component({
  selector: 'app-entrenador-cliente',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, CargaComponent, EstadoMembresiaComponent, GraficoPesoComponent, PerimetrosControlComponent],
  templateUrl: './cliente.html',
})
export class EntrenadorClienteComponent {
  private readonly service = inject(EntrenadorService);

  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly detalle = signal<DetalleClienteAsignado | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly noAsignado = signal(false);

  protected readonly abreviaturaDocumento = abreviaturaDocumento;
  protected readonly nombre = computed(() => {
    const d = this.detalle();
    return d ? nombreCompleto(d.cliente) : '';
  });
  protected readonly iniciales = computed(() => {
    const d = this.detalle();
    return d ? iniciales(d.cliente) : '';
  });

  protected readonly membresia = computed(() => {
    const m = this.detalle()?.cliente.membresia;
    if (!m) return null;
    const estado = estadoVisual(m);
    let dias: string;
    switch (estado) {
      case 'Programada':
        dias = `Empieza en ${diasParaEmpezar(m)} días`;
        break;
      case 'Vencida':
        dias = `Venció hace ${diasDesdeQueVencio(m)} días`;
        break;
      case 'Cancelada':
        dias = 'Cancelada';
        break;
      default:
        dias = `${diasRestantes(m)} días restantes`;
    }
    return { ...m, estado, dias };
  });

  // Cada control con sus perímetros y la variación de cada uno respecto a su medida anterior
  protected readonly historial = computed(() => {
    const controles = this.detalle()?.controles ?? [];
    return controles.map((c, i) => ({ ...c, medidos: perimetrosMedidos(controles, i) }));
  });

  // Los controles llegan del más reciente al más antiguo
  protected readonly resumen = computed(() => {
    const c = this.detalle()?.controles ?? [];
    if (!c.length) return null;
    return { actual: c[0].peso, variacion: c.length >= 2 ? c[0].peso - c[c.length - 1].peso : null, total: c.length };
  });

  constructor() {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.error.set(null);
    try {
      this.detalle.set(await firstValueFrom(this.service.detalle(this.id)));
    } catch (e) {
      if (esNoEncontrado(e)) this.noAsignado.set(true);
      this.error.set(mensajeError(e, 'No se pudo cargar al cliente. Inténtalo de nuevo.'));
    }
  }
}
