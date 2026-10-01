import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { CajaService } from '../../services/caja.service';
import { CompraService } from '../../services/compra.service';
import { VentaService } from '../../services/venta.service';
import { Compra, Impuesto, Proveedor } from '../../models/compra.model';
import { Producto } from '../../models/venta.model';
import { fechaIso, mensajeError } from '../../utils/http-error';

interface LineaCompra {
  producto: Producto;
  impuesto: Impuesto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  montoImpuesto: number;
}

/**
 * Diagrama "Registrar compra": proveedor -> factura y fecha (se verifica que no esté duplicada)
 * -> agregar productos con cantidad, precio e impuesto -> resumen -> confirmar (suma stock).
 */
@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    NgTemplateOutlet,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToggleSwitchModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './compras.html',
})
export class ComprasComponent implements OnInit {
  private readonly compraService = inject(CompraService);
  private readonly ventaService = inject(VentaService);
  private readonly cajaService = inject(CajaService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly compras = signal<Compra[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly comprasFiltradas = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    if (!texto) return this.compras();
    return this.compras().filter((c) => `${c.proveedor} ${c.ruc ?? ''} ${c.codigoFactura}`.toLowerCase().includes(texto));
  });

  // Detalle
  readonly detalleVisible = signal(false);
  readonly detalle = signal<Compra | null>(null);
  readonly cargandoDetalle = signal(false);

  // Registrar
  readonly registroVisible = signal(false);
  readonly cargandoCatalogos = signal(false);
  readonly proveedores = signal<Proveedor[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly impuestos = signal<Impuesto[]>([]);
  readonly hoy = fechaIso(new Date());

  idProveedor: number | null = null;
  codigoFactura = '';
  fechaCompra = this.hoy;
  readonly facturaVerificada = signal(false);
  readonly verificando = signal(false);
  readonly avisoFactura = signal<string | null>(null);

  idProducto: number | null = null;
  cantidad: number | null = 1;
  precioUnitario: number | null = null;
  idImpuesto: number | null = null;
  readonly errorLinea = signal<string | null>(null);
  readonly lineas = signal<LineaCompra[]>([]);
  readonly guardando = signal(false);
  // Pagar con el dinero de la caja abierta: se resta del monto esperado al cerrarla
  readonly hayCaja = signal(false);
  pagoConCaja = false;

  readonly subtotal = computed(() => this.redondear(this.lineas().reduce((s, l) => s + l.subtotal, 0)));
  readonly impuesto = computed(() => this.redondear(this.lineas().reduce((s, l) => s + l.montoImpuesto, 0)));
  readonly total = computed(() => this.redondear(this.subtotal() + this.impuesto()));

  // Comprobante
  readonly comprobante = signal<Compra | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.compras.set(await firstValueFrom(this.compraService.listar()));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar las compras.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- Detalle ----------

  async verDetalle(compra: Compra): Promise<void> {
    this.detalle.set(null);
    this.detalleVisible.set(true);
    this.cargandoDetalle.set(true);
    try {
      this.detalle.set(await firstValueFrom(this.compraService.obtener(compra.id)));
    } catch (e) {
      this.detalleVisible.set(false);
      this.toast('error', 'No se pudo cargar la compra', mensajeError(e, ''));
    } finally {
      this.cargandoDetalle.set(false);
    }
  }

  // ---------- Registrar ----------

  async abrirRegistro(): Promise<void> {
    this.idProveedor = null;
    this.codigoFactura = '';
    this.fechaCompra = this.hoy;
    this.facturaVerificada.set(false);
    this.avisoFactura.set(null);
    this.limpiarLinea();
    this.lineas.set([]);
    this.pagoConCaja = false;
    this.registroVisible.set(true);

    this.cargandoCatalogos.set(true);
    try {
      const [proveedores, productos, impuestos, caja] = await Promise.all([
        firstValueFrom(this.compraService.proveedores()),
        firstValueFrom(this.ventaService.productos()),
        firstValueFrom(this.compraService.impuestos()),
        firstValueFrom(this.cajaService.actual()),
      ]);
      this.hayCaja.set(!!caja);
      this.proveedores.set(proveedores);
      this.productos.set(productos);
      this.impuestos.set(impuestos);
      this.idImpuesto = impuestos[0]?.id ?? null;
    } catch (e) {
      this.registroVisible.set(false);
      this.toast('error', 'No se pudo iniciar la compra', mensajeError(e, ''));
    } finally {
      this.cargandoCatalogos.set(false);
    }
  }

  // Verificar factura: ¿ya registrada para el proveedor?
  async verificarFactura(): Promise<void> {
    const codigo = this.codigoFactura.trim();
    if (this.idProveedor === null || !codigo || !this.fechaCompra) {
      this.avisoFactura.set('Selecciona el proveedor e ingresa el código de factura y la fecha.');
      return;
    }
    if (this.fechaCompra > this.hoy) {
      this.avisoFactura.set('La fecha de compra no puede ser futura.');
      return;
    }

    this.verificando.set(true);
    this.avisoFactura.set(null);
    try {
      if (await firstValueFrom(this.compraService.facturaRegistrada(this.idProveedor, codigo))) {
        this.avisoFactura.set(`La factura ${codigo} ya está registrada para este proveedor.`);
      } else {
        this.facturaVerificada.set(true);
      }
    } catch (e) {
      this.avisoFactura.set(mensajeError(e, 'No se pudo verificar la factura.'));
    } finally {
      this.verificando.set(false);
    }
  }

  cambiarFactura(): void {
    this.facturaVerificada.set(false);
  }

  // Agregar producto -> validar cantidad y precio -> calcular subtotal e impuesto de la línea
  agregarLinea(): void {
    const producto = this.productos().find((p) => p.id === this.idProducto);
    const impuesto = this.impuestos().find((i) => i.id === this.idImpuesto);
    if (!producto || !impuesto) {
      this.errorLinea.set('Selecciona el producto y el impuesto.');
      return;
    }
    if (!this.cantidad || this.cantidad < 1 || !Number.isInteger(this.cantidad)) {
      this.errorLinea.set('La cantidad debe ser un número entero mayor a 0.');
      return;
    }
    if (!this.precioUnitario || this.precioUnitario <= 0) {
      this.errorLinea.set('El precio unitario debe ser mayor a 0.');
      return;
    }

    const subtotal = this.redondear(this.cantidad * this.precioUnitario);
    this.lineas.update((ls) => [
      ...ls,
      {
        producto,
        impuesto,
        cantidad: this.cantidad!,
        precioUnitario: this.precioUnitario!,
        subtotal,
        montoImpuesto: this.redondear((subtotal * impuesto.porcentaje) / 100),
      },
    ]);
    this.limpiarLinea();
  }

  quitarLinea(index: number): void {
    this.lineas.update((ls) => ls.filter((_, i) => i !== index));
  }

  confirmarCompra(): void {
    if (!this.lineas().length || this.idProveedor === null) return;
    const proveedor = this.proveedores().find((p) => p.id === this.idProveedor);
    this.confirmationService.confirm({
      header: 'Confirmar compra',
      message:
        `Factura ${this.codigoFactura.trim()} de ${proveedor?.razonSocial ?? ''} por S/ ${this.total().toFixed(2)}. Se sumará el stock de ${this.lineas().length} producto(s).` +
        (this.pagoConCaja ? ' El monto se descontará de la caja.' : ''),
      icon: 'pi pi-truck',
      acceptLabel: 'Registrar compra',
      rejectLabel: 'Revisar',
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.registrar(),
    });
  }

  private async registrar(): Promise<void> {
    this.guardando.set(true);
    try {
      const compra = await firstValueFrom(
        this.compraService.registrar({
          idProveedor: this.idProveedor!,
          codigoFactura: this.codigoFactura.trim(),
          fechaCompra: this.fechaCompra,
          detalles: this.lineas().map((l) => ({
            idProducto: l.producto.id,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            idImpuesto: l.impuesto.id,
          })),
          pagoConCaja: this.pagoConCaja,
        }),
      );
      this.registroVisible.set(false);
      this.compras.update((lista) => [{ ...compra, detalles: null }, ...lista]);
      this.comprobante.set(compra);
    } catch (e) {
      this.toast('error', 'No se pudo registrar la compra', mensajeError(e, 'Inténtalo de nuevo.'));
      // Si otro usuario cerró la caja, ya no se puede pagar con ella
      if (this.pagoConCaja) {
        const caja = await firstValueFrom(this.cajaService.actual()).catch(() => undefined);
        if (caja === null) {
          this.hayCaja.set(false);
          this.pagoConCaja = false;
        }
      }
    } finally {
      this.guardando.set(false);
    }
  }

  // ---------- Helpers ----------

  private limpiarLinea(): void {
    this.idProducto = null;
    this.cantidad = 1;
    this.precioUnitario = null;
    this.errorLinea.set(null);
  }

  private redondear(n: number): number {
    return Math.round(n * 100) / 100;
  }

  private toast(severity: 'success' | 'warn' | 'error', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
