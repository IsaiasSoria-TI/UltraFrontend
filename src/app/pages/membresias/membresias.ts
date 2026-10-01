import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { BuscarClienteComponent } from '../../components/buscar-cliente/buscar-cliente';
import { AuthService } from '../../services/auth.service';
import { CajaService } from '../../services/caja.service';
import { MembresiaService } from '../../services/membresia.service';
import { Cliente, EstadoMembresia } from '../../models/cliente.model';
import { MetodoPago } from '../../models/caja.model';
import { ClienteMembresia, Cotizacion, Plan } from '../../models/membresia.model';
import { mensajeError } from '../../utils/http-error';

type FiltroEstado = 'todas' | EstadoMembresia;

// Turno: cobradas en la caja abierta (se vacía al cerrarla); historial: todas
type Vista = 'turno' | 'historial';

/**
 * Diagrama "Vender membresía": caja abierta -> buscar (o registrar) cliente -> elegir plan ->
 * el sistema calcula inicio/fin (renovación si ya tiene una vigente) -> cobrar y confirmar.
 */
@Component({
  selector: 'app-membresias',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
    BuscarClienteComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './membresias.html',
})
export class MembresiasComponent implements OnInit {
  private readonly membresiaService = inject(MembresiaService);
  private readonly cajaService = inject(CajaService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly esAdministrador = inject(AuthService).esAdministrador();

  readonly membresias = signal<ClienteMembresia[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly vista = signal<Vista>('turno');
  readonly opcionesVista = [
    { label: 'Turno actual', value: 'turno' },
    { label: 'Historial', value: 'historial' },
  ];

  // Filtros
  readonly busqueda = signal('');
  readonly filtroEstado = signal<FiltroEstado>('todas');
  readonly opcionesFiltro = [
    { label: 'Todas', value: 'todas' },
    { label: 'Activas', value: 'activo' },
    { label: 'Programadas', value: 'programado' },
    { label: 'Vencidas', value: 'vencido' },
    { label: 'Canceladas', value: 'cancelado' },
  ];

  readonly membresiasFiltradas = computed(() => {
    const texto = this.normalizar(this.busqueda());
    const estado = this.filtroEstado();
    return this.membresias().filter((m) => {
      if (estado !== 'todas' && m.estado !== estado) return false;
      if (!texto) return true;
      return this.normalizar(`${m.cliente} ${m.dni} ${m.correo} ${m.plan}`).includes(texto);
    });
  });

  // Venta
  readonly ventaVisible = signal(false);
  readonly verificandoCaja = signal(false);
  readonly hayCaja = signal(false);
  readonly planes = signal<Plan[]>([]);
  readonly metodos = signal<MetodoPago[]>([]);
  readonly cliente = signal<Cliente | null>(null);
  readonly planSeleccionado = signal<number | null>(null);
  readonly cotizacion = signal<Cotizacion | null>(null);
  readonly cotizando = signal(false);
  metodoSeleccionado: number | null = null;
  readonly vendiendo = signal(false);

  // Comprobante
  readonly comprobante = signal<ClienteMembresia | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cambiarVista(vista: Vista): void {
    this.vista.set(vista);
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.membresias.set(
        await firstValueFrom(
          this.vista() === 'turno' ? this.membresiaService.listarTurno() : this.membresiaService.listar(),
        ),
      );
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar las membresías.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- Vender o renovar ----------

  async abrirVenta(): Promise<void> {
    this.limpiarVenta();
    this.ventaVisible.set(true);

    // Verificar caja abierta
    this.verificandoCaja.set(true);
    try {
      const [caja, planes, metodos] = await Promise.all([
        firstValueFrom(this.cajaService.actual()),
        firstValueFrom(this.membresiaService.planes()),
        firstValueFrom(this.cajaService.metodosPago()),
      ]);
      this.hayCaja.set(!!caja);
      this.planes.set(planes);
      this.metodos.set(metodos);
      this.metodoSeleccionado = metodos[0]?.id ?? null;
    } catch (e) {
      this.ventaVisible.set(false);
      this.toast('error', 'No se pudo iniciar la venta', mensajeError(e, ''));
    } finally {
      this.verificandoCaja.set(false);
    }
  }

  private limpiarVenta(): void {
    this.cliente.set(null);
    this.planSeleccionado.set(null);
    this.cotizacion.set(null);
    this.metodoSeleccionado = null;
  }

  onCliente(cliente: Cliente | null): void {
    this.cliente.set(cliente);
    this.cotizacion.set(null);
    const plan = this.planSeleccionado();
    if (cliente && plan !== null) {
      this.elegirPlan(plan);
    }
  }

  // Obtener precio y duración del plan y calcular fechas
  async elegirPlan(idPlan: number): Promise<void> {
    this.planSeleccionado.set(idPlan);
    const cliente = this.cliente();
    if (!cliente) return;

    this.cotizando.set(true);
    this.cotizacion.set(null);
    try {
      this.cotizacion.set(await firstValueFrom(this.membresiaService.cotizar(cliente.id, idPlan)));
    } catch (e) {
      this.toast('error', 'No se pudo calcular la membresía', mensajeError(e, ''));
    } finally {
      this.cotizando.set(false);
    }
  }

  async confirmarVenta(): Promise<void> {
    const c = this.cotizacion();
    if (!c || this.metodoSeleccionado === null) return;

    this.vendiendo.set(true);
    try {
      const vendida = await firstValueFrom(
        this.membresiaService.vender({ idCliente: c.idCliente, idMembresia: c.idMembresia, idMetodoPago: this.metodoSeleccionado }),
      );
      this.ventaVisible.set(false);
      this.membresias.update((lista) => [vendida, ...lista]);
      this.comprobante.set(vendida);
    } catch (e) {
      this.toast('error', 'No se pudo registrar la venta', mensajeError(e, 'Inténtalo de nuevo.'));
      // Si otro usuario cerró la caja, la venta en curso se descarta
      const caja = await firstValueFrom(this.cajaService.actual()).catch(() => undefined);
      if (caja === null) {
        this.limpiarVenta();
        this.hayCaja.set(false);
        this.cargar();
      }
    } finally {
      this.vendiendo.set(false);
    }
  }

  // ---------- Cancelar (Administrador) ----------

  confirmarCancelacion(m: ClienteMembresia): void {
    this.confirmationService.confirm({
      header: 'Cancelar membresía',
      message: `La membresía ${m.plan} de ${m.cliente} quedará cancelada y no se contará en la caja. Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cancelar membresía',
      rejectLabel: 'Volver',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.cancelar(m),
    });
  }

  private async cancelar(m: ClienteMembresia): Promise<void> {
    try {
      const actualizada = await firstValueFrom(this.membresiaService.cancelar(m.id));
      this.membresias.update((lista) => lista.map((x) => (x.id === actualizada.id ? actualizada : x)));
      this.toast('success', 'Membresía cancelada', `${m.plan} de ${m.cliente} fue cancelada.`);
    } catch (e) {
      this.toast('error', 'No se pudo cancelar', mensajeError(e, ''));
    }
  }

  // ---------- Helpers de vista ----------

  severidad(estado: EstadoMembresia): 'success' | 'info' | 'secondary' | 'danger' {
    return ({ activo: 'success', programado: 'info', vencido: 'secondary', cancelado: 'danger' } as const)[estado];
  }

  etiqueta(estado: EstadoMembresia): string {
    return { activo: 'Activa', programado: 'Programada', vencido: 'Vencida', cancelado: 'Cancelada' }[estado];
  }

  // La fecha fin guardada es exclusiva (00:00 del día siguiente al último día)
  ultimoDia(fechaFin: string): Date {
    return new Date(new Date(fechaFin).getTime() - 1);
  }

  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  private toast(severity: 'success' | 'warn' | 'error', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
