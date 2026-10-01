import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { CajaService } from '../../services/caja.service';
import { Caja } from '../../models/caja.model';
import { mensajeError } from '../../utils/http-error';

/**
 * Diagrama "Abrir o cerrar caja": si no hay caja abierta se muestra el formulario de apertura;
 * si la hay, el resumen del turno y el cierre (monto final contado vs. esperado).
 */
@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputNumberModule,
    ToastModule,
    SkeletonModule,
    MessageModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './caja.html',
})
export class CajaComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
  private readonly messageService = inject(MessageService);

  readonly caja = signal<Caja | null>(null);
  readonly historial = signal<Caja[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Apertura
  montoInicial: number | null = null;
  readonly montoInicialInvalido = signal(false);
  readonly abriendo = signal(false);

  // Cierre
  readonly cierreVisible = signal(false);
  readonly montoFinal = signal<number | null>(null);
  readonly cerrando = signal(false);
  readonly diferenciaCierre = computed(() => {
    const final = this.montoFinal();
    const esperado = this.caja()?.montoEsperado;
    return final === null || esperado == null ? null : this.redondear(final - esperado);
  });

  // Reporte de cierre
  readonly reporte = signal<Caja | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [actual, historial] = await Promise.all([
        firstValueFrom(this.cajaService.actual()),
        firstValueFrom(this.cajaService.historial()),
      ]);
      this.caja.set(actual);
      this.historial.set(historial);
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo consultar la caja.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- Apertura ----------

  async abrir(): Promise<void> {
    // ¿Monto válido? (mayor o igual a 0)
    if (this.montoInicial === null || this.montoInicial < 0) {
      this.montoInicialInvalido.set(true);
      return;
    }
    this.montoInicialInvalido.set(false);

    this.abriendo.set(true);
    try {
      this.caja.set(await firstValueFrom(this.cajaService.abrir(this.montoInicial)));
      this.montoInicial = null;
      this.toast('success', 'Caja abierta', 'Ya puedes registrar ventas y membresías.');
    } catch (e) {
      this.toast('error', 'No se pudo abrir la caja', mensajeError(e, 'Inténtalo de nuevo.'));
      // Otro usuario pudo abrirla mientras tanto
      this.cargar();
    } finally {
      this.abriendo.set(false);
    }
  }

  // ---------- Cierre ----------

  async abrirCierre(): Promise<void> {
    // Recalcula el monto esperado con lo último registrado antes de contar
    try {
      const actual = await firstValueFrom(this.cajaService.actual());
      this.caja.set(actual);
      if (!actual) {
        this.toast('warn', 'La caja ya está cerrada', 'Otro usuario la cerró.');
        this.cargar();
        return;
      }
    } catch (e) {
      this.toast('error', 'No se pudo consultar la caja', mensajeError(e, ''));
      return;
    }
    this.montoFinal.set(null);
    this.cierreVisible.set(true);
  }

  async confirmarCierre(): Promise<void> {
    const monto = this.montoFinal();
    if (monto === null || monto < 0) return;

    this.cerrando.set(true);
    try {
      const cerrada = await firstValueFrom(this.cajaService.cerrar(monto));
      this.cierreVisible.set(false);
      this.caja.set(null);
      this.historial.update((lista) => [cerrada, ...lista]);
      this.reporte.set(cerrada);
    } catch (e) {
      this.toast('error', 'No se pudo cerrar la caja', mensajeError(e, 'Inténtalo de nuevo.'));
    } finally {
      this.cerrando.set(false);
    }
  }

  // ---------- Helpers de vista ----------

  claseDiferencia(diferencia: number | null): string {
    if (diferencia === null || diferencia === 0) return 'text-emerald-700 dark:text-emerald-400';
    return diferencia < 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400';
  }

  textoDiferencia(diferencia: number | null): string {
    if (diferencia === null) return '';
    if (diferencia === 0) return 'Cuadra exacto';
    return diferencia < 0 ? 'Falta dinero' : 'Sobra dinero';
  }

  private redondear(n: number): number {
    return Math.round(n * 100) / 100;
  }

  private toast(severity: 'success' | 'warn' | 'error', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
