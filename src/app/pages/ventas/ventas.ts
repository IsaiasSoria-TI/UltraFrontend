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
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { BuscarClienteComponent } from '../../components/buscar-cliente/buscar-cliente';
import { AuthService } from '../../services/auth.service';
import { CajaService } from '../../services/caja.service';
import { VentaService } from '../../services/venta.service';
import { Cliente } from '../../models/cliente.model';
import { MetodoPago } from '../../models/caja.model';
import { EstadoVenta, Producto, Venta } from '../../models/venta.model';
import { fechaIso, mensajeError } from '../../utils/http-error';

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

// Turno: ventas de la caja abierta (se vacía al cerrarla); fechas: consulta histórica
type Vista = 'turno' | 'fechas';

/**
 * Diagrama "Vender productos": caja abierta -> (opcional) asociar cliente -> agregar productos
 * verificando stock -> resumen y total -> cobrar y confirmar (descuenta stock) -> comprobante.
 */
@Component({
  selector: 'app-ventas',
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
    DrawerModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    ToggleSwitchModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
    BuscarClienteComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './ventas.html',
})
export class VentasComponent implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly cajaService = inject(CajaService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly esAdministrador = inject(AuthService).esAdministrador();

  readonly ventas = signal<Venta[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly vista = signal<Vista>('turno');
  readonly opcionesVista = [
    { label: 'Turno actual', value: 'turno' },
    { label: 'Por fechas', value: 'fechas' },
  ];

  // Filtro por fechas (últimos 7 días por defecto)
  desde = fechaIso(new Date(Date.now() - 6 * 86_400_000));
  hasta = fechaIso(new Date());

  readonly totalActivas = computed(() =>
    this.ventas().filter((v) => v.estado === 'activa').reduce((suma, v) => suma + v.total, 0),
  );

  // Detalle
  readonly detalleVisible = signal(false);
  readonly detalle = signal<Venta | null>(null);
  readonly cargandoDetalle = signal(false);

  // Nueva venta
  readonly ventaVisible = signal(false);
  readonly verificandoCaja = signal(false);
  readonly hayCaja = signal(false);
  readonly productos = signal<Producto[]>([]);
  readonly metodos = signal<MetodoPago[]>([]);
  asociarCliente = false;
  readonly cliente = signal<Cliente | null>(null);
  readonly carrito = signal<ItemCarrito[]>([]);
  productoSeleccionado: number | null = null;
  cantidad = 1;
  readonly avisoStock = signal<string | null>(null);
  metodoSeleccionado: number | null = null;
  readonly vendiendo = signal(false);

  readonly totalCarrito = computed(() =>
    this.carrito().reduce((suma, i) => suma + i.producto.precio * i.cantidad, 0),
  );
  readonly productosDisponibles = computed(() => this.productos().filter((p) => p.stock > 0));

  // Comprobante
  readonly comprobante = signal<Venta | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cambiarVista(vista: Vista): void {
    this.vista.set(vista);
    this.cargar();
  }

  async cargar(): Promise<void> {
    const porFechas = this.vista() === 'fechas';
    if (porFechas && (!this.desde || !this.hasta)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      this.ventas.set(
        await firstValueFrom(
          porFechas ? this.ventaService.listar(this.desde, this.hasta) : this.ventaService.listarTurno(),
        ),
      );
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar las ventas.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- Detalle ----------

  async verDetalle(venta: Venta): Promise<void> {
    this.detalle.set(null);
    this.detalleVisible.set(true);
    this.cargandoDetalle.set(true);
    try {
      this.detalle.set(await firstValueFrom(this.ventaService.obtener(venta.id)));
    } catch (e) {
      this.detalleVisible.set(false);
      this.toast('error', 'No se pudo cargar la venta', mensajeError(e, ''));
    } finally {
      this.cargandoDetalle.set(false);
    }
  }

  // ---------- Nueva venta ----------

  async abrirVenta(): Promise<void> {
    this.limpiarVenta();
    this.ventaVisible.set(true);

    // Verificar caja abierta
    this.verificandoCaja.set(true);
    try {
      const [caja, productos, metodos] = await Promise.all([
        firstValueFrom(this.cajaService.actual()),
        firstValueFrom(this.ventaService.productos()),
        firstValueFrom(this.cajaService.metodosPago()),
      ]);
      this.hayCaja.set(!!caja);
      this.productos.set(productos);
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
    this.asociarCliente = false;
    this.cliente.set(null);
    this.carrito.set([]);
    this.productoSeleccionado = null;
    this.cantidad = 1;
    this.avisoStock.set(null);
  }

  onAsociarCliente(asociar: boolean): void {
    this.asociarCliente = asociar;
    if (!asociar) this.cliente.set(null);
  }

  // Agregar producto y cantidad -> verificar stock
  agregar(): void {
    const producto = this.productos().find((p) => p.id === this.productoSeleccionado);
    if (!producto || !this.cantidad || this.cantidad < 1) return;

    const enCarrito = this.carrito().find((i) => i.producto.id === producto.id)?.cantidad ?? 0;
    if (enCarrito + this.cantidad > producto.stock) {
      this.avisoStock.set(
        `Stock insuficiente de ${producto.nombre}: disponible ${producto.stock}` +
          (enCarrito ? ` (ya agregaste ${enCarrito}).` : '.'),
      );
      return;
    }

    this.avisoStock.set(null);
    this.carrito.update((items) =>
      enCarrito
        ? items.map((i) => (i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + this.cantidad } : i))
        : [...items, { producto, cantidad: this.cantidad }],
    );
    this.productoSeleccionado = null;
    this.cantidad = 1;
  }

  cambiarCantidad(item: ItemCarrito, cantidad: number | null): void {
    const valor = Math.min(Math.max(cantidad ?? 1, 1), item.producto.stock);
    this.carrito.update((items) => items.map((i) => (i.producto.id === item.producto.id ? { ...i, cantidad: valor } : i)));
  }

  quitar(item: ItemCarrito): void {
    this.carrito.update((items) => items.filter((i) => i.producto.id !== item.producto.id));
  }

  async confirmarVenta(): Promise<void> {
    if (!this.carrito().length || this.metodoSeleccionado === null) return;
    if (this.asociarCliente && !this.cliente()) {
      this.toast('warn', 'Falta el cliente', 'Busca el cliente o desactiva "Asociar a un cliente".');
      return;
    }

    this.vendiendo.set(true);
    try {
      const venta = await firstValueFrom(
        this.ventaService.registrar({
          idCliente: this.cliente()?.id ?? null,
          idMetodoPago: this.metodoSeleccionado,
          detalles: this.carrito().map((i) => ({ idProducto: i.producto.id, cantidad: i.cantidad })),
        }),
      );
      this.ventaVisible.set(false);
      this.comprobante.set(venta);
      this.cargar();
    } catch (e) {
      this.toast('error', 'No se pudo registrar la venta', mensajeError(e, 'Inténtalo de nuevo.'));
      // Si otro usuario cerró la caja, la venta en curso se descarta
      const caja = await firstValueFrom(this.cajaService.actual()).catch(() => undefined);
      if (caja === null) {
        this.limpiarVenta();
        this.hayCaja.set(false);
        this.cargar();
        return;
      }
      // El stock pudo cambiar por otra venta: se refresca para mostrar el disponible real
      this.ventaService.productos().subscribe((p) => this.productos.set(p));
    } finally {
      this.vendiendo.set(false);
    }
  }

  // ---------- Anular (Administrador) ----------

  confirmarAnulacion(venta: Venta): void {
    this.confirmationService.confirm({
      header: `Anular venta N.º ${venta.id}`,
      message: 'La venta quedará anulada y se devolverá el stock de sus productos. Esta acción no se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Anular venta',
      rejectLabel: 'Volver',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.anular(venta),
    });
  }

  private async anular(venta: Venta): Promise<void> {
    try {
      const anulada = await firstValueFrom(this.ventaService.anular(venta.id));
      this.ventas.update((lista) => lista.map((v) => (v.id === anulada.id ? { ...anulada, detalles: null } : v)));
      if (this.detalle()?.id === anulada.id) this.detalle.set(anulada);
      this.toast('success', 'Venta anulada', `La venta N.º ${venta.id} fue anulada y el stock devuelto.`);
    } catch (e) {
      this.toast('error', 'No se pudo anular', mensajeError(e, ''));
    }
  }

  // ---------- Helpers de vista ----------

  severidad(estado: EstadoVenta): 'success' | 'danger' {
    return estado === 'activa' ? 'success' : 'danger';
  }

  etiqueta(estado: EstadoVenta): string {
    return estado === 'activa' ? 'Activa' : 'Anulada';
  }

  private toast(severity: 'success' | 'warn' | 'error', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
