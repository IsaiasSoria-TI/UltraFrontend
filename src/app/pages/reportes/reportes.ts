import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { ReporteService } from '../../services/reporte.service';
import { Reporte } from '../../models/admin.model';
import { fechaIso, mensajeError } from '../../utils/http-error';

interface Barra {
  fecha: string;
  ventas: number;
  membresias: number;
  total: number;
  // alturas en % del máximo del periodo
  alturaVentas: number;
  alturaMembresias: number;
  etiqueta: boolean;
}

// Caso de uso "Ver reportes" (Administrador)
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, ButtonModule, InputTextModule, SkeletonModule, MessageModule],
  templateUrl: './reportes.html',
})
export class ReportesComponent implements OnInit {
  private readonly reporteService = inject(ReporteService);

  readonly reporte = signal<Reporte | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly hoy = fechaIso(new Date());
  desde = fechaIso(new Date(Date.now() - 29 * 86_400_000));
  hasta = this.hoy;
  readonly rapidos = [
    { label: '7 días', dias: 7 },
    { label: '30 días', dias: 30 },
    { label: '90 días', dias: 90 },
  ];

  readonly maxDia = computed(() =>
    Math.max(0, ...(this.reporte()?.porDia ?? []).map((d) => d.ventas + d.membresias)),
  );

  readonly barras = computed<Barra[]>(() => {
    const dias = this.reporte()?.porDia ?? [];
    const max = this.maxDia();
    // Con muchos días solo se rotulan ~8 fechas
    const cada = Math.max(1, Math.ceil(dias.length / 8));
    return dias.map((d, i) => ({
      fecha: d.fecha,
      ventas: d.ventas,
      membresias: d.membresias,
      total: d.ventas + d.membresias,
      alturaVentas: max > 0 ? (d.ventas / max) * 100 : 0,
      alturaMembresias: max > 0 ? (d.membresias / max) * 100 : 0,
      etiqueta: i % cada === 0 || i === dias.length - 1,
    }));
  });

  readonly maxMetodo = computed(() => Math.max(0, ...(this.reporte()?.porMetodo ?? []).map((m) => m.total)));

  ngOnInit(): void {
    this.cargar();
  }

  rango(dias: number): void {
    this.hasta = this.hoy;
    this.desde = fechaIso(new Date(Date.now() - (dias - 1) * 86_400_000));
    this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.desde || !this.hasta) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      this.reporte.set(await firstValueFrom(this.reporteService.generar(this.desde, this.hasta)));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo generar el reporte.'));
    } finally {
      this.loading.set(false);
    }
  }

  porcentaje(valor: number, total: number): number {
    return total > 0 ? (valor / total) * 100 : 0;
  }
}
