import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { DashboardService } from '../../../services/dashboard.service';
import { DashboardResumen, VentaDia } from '../../../models/dashboard.model';

interface BarraVenta extends VentaDia {
  altura: number;
  esHoy: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TagModule, TableModule, SkeletonModule, MessageModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly resumen = signal<DashboardResumen | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly maxVentaDia = computed(() => {
    const dias = this.resumen()?.ventasUltimos7Dias ?? [];
    return Math.max(0, ...dias.map((d) => d.total));
  });

  readonly barras = computed<BarraVenta[]>(() => {
    const dias = this.resumen()?.ventasUltimos7Dias ?? [];
    const max = this.maxVentaDia();
    return dias.map((d, i) => ({
      ...d,
      // mínimo visible para días con ventas pequeñas; 0 si no hubo ventas
      altura: max > 0 && d.total > 0 ? Math.max((d.total / max) * 100, 2) : 0,
      esHoy: i === dias.length - 1,
    }));
  });

  readonly totalSemana = computed(() =>
    (this.resumen()?.ventasUltimos7Dias ?? []).reduce((acc, d) => acc + d.total, 0),
  );

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.resumen.set(await firstValueFrom(this.dashboardService.getResumen()));
    } catch {
      this.error.set('No se pudo cargar el resumen. Verifica que el backend esté en ejecución.');
    } finally {
      this.loading.set(false);
    }
  }

  textoVencimiento(dias: number): string {
    if (dias <= 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    return `En ${dias} días`;
  }
}
