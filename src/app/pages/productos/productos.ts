import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/venta.model';
import { Categoria, ProductoRequest } from '../../models/admin.model';
import { mensajeError } from '../../utils/http-error';

// Mismo umbral que "stock bajo" del dashboard
const STOCK_MINIMO = 5;

// Caso de uso "Gestionar productos" (Administrador)
@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './productos.html',
})
export class ProductosComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  readonly stockMinimo = STOCK_MINIMO;
  readonly productos = signal<Producto[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroCategoria = signal<number | null>(null);
  readonly productosFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const categoria = this.filtroCategoria();
    return this.productos().filter(
      (p) => (categoria === null || p.idCategoria === categoria) && (!texto || p.nombre.toLowerCase().includes(texto)),
    );
  });
  readonly totalStockBajo = computed(() => this.productos().filter((p) => p.stock <= STOCK_MINIMO).length);

  // Formulario de producto
  readonly formVisible = signal(false);
  readonly editando = signal<Producto | null>(null);
  readonly guardando = signal(false);
  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    idCategoria: [null as number | null, Validators.required],
    precio: [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock: [0 as number | null, [Validators.required, Validators.min(0)]],
  });

  // Categorías
  readonly categoriasVisible = signal(false);
  nuevaCategoria = '';
  readonly editandoCategoria = signal<number | null>(null);
  nombreCategoria = '';

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [productos, categorias] = await Promise.all([
        firstValueFrom(this.productoService.listar()),
        firstValueFrom(this.productoService.categorias()),
      ]);
      this.productos.set(productos);
      this.categorias.set(categorias);
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar los productos.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- Productos ----------

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset({ stock: 0 });
    this.formVisible.set(true);
  }

  abrirEditar(p: Producto): void {
    this.editando.set(p);
    this.form.reset({ nombre: p.nombre, idCategoria: p.idCategoria, precio: p.precio, stock: p.stock });
    this.formVisible.set(true);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos: ProductoRequest = { nombre: v.nombre!.trim(), idCategoria: v.idCategoria!, precio: v.precio!, stock: v.stock! };

    this.guardando.set(true);
    try {
      const actual = this.editando();
      const producto = actual
        ? await firstValueFrom(this.productoService.actualizar(actual.id, datos))
        : await firstValueFrom(this.productoService.crear(datos));
      this.productos.update((l) =>
        (actual ? l.map((p) => (p.id === producto.id ? producto : p)) : [...l, producto]).sort((a, b) =>
          a.nombre.localeCompare(b.nombre),
        ),
      );
      this.toast('success', actual ? 'Producto actualizado' : 'Producto creado', producto.nombre);
      this.formVisible.set(false);
      this.recargarCategorias();
    } catch (e) {
      this.toast('error', 'No se pudo guardar', mensajeError(e, 'Revisa los datos.'));
    } finally {
      this.guardando.set(false);
    }
  }

  confirmarEliminacion(p: Producto): void {
    this.confirmationService.confirm({
      header: 'Eliminar producto',
      message: `Se eliminará ${p.nombre}. Solo es posible si no tiene ventas ni compras registradas.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: async () => {
        try {
          await firstValueFrom(this.productoService.eliminar(p.id));
          this.productos.update((l) => l.filter((x) => x.id !== p.id));
          this.toast('success', 'Producto eliminado', p.nombre);
          this.recargarCategorias();
        } catch (e) {
          this.toast('error', 'No se pudo eliminar', mensajeError(e, ''));
        }
      },
    });
  }

  invalido(campo: 'nombre' | 'idCategoria' | 'precio' | 'stock'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  // ---------- Categorías ----------

  async agregarCategoria(): Promise<void> {
    const nombre = this.nuevaCategoria.trim();
    if (!nombre) return;
    try {
      const c = await firstValueFrom(this.productoService.crearCategoria(nombre));
      this.categorias.update((l) => [...l, c].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      this.nuevaCategoria = '';
    } catch (e) {
      this.toast('error', 'No se pudo crear la categoría', mensajeError(e, ''));
    }
  }

  editarCategoria(c: Categoria): void {
    this.editandoCategoria.set(c.id);
    this.nombreCategoria = c.nombre;
  }

  async guardarCategoria(c: Categoria): Promise<void> {
    const nombre = this.nombreCategoria.trim();
    if (!nombre) return;
    try {
      const actualizada = await firstValueFrom(this.productoService.actualizarCategoria(c.id, nombre));
      this.categorias.update((l) => l.map((x) => (x.id === c.id ? actualizada : x)));
      this.productos.update((l) => l.map((p) => (p.idCategoria === c.id ? { ...p, categoria: actualizada.nombre } : p)));
      this.editandoCategoria.set(null);
    } catch (e) {
      this.toast('error', 'No se pudo renombrar', mensajeError(e, ''));
    }
  }

  async eliminarCategoria(c: Categoria): Promise<void> {
    try {
      await firstValueFrom(this.productoService.eliminarCategoria(c.id));
      this.categorias.update((l) => l.filter((x) => x.id !== c.id));
      if (this.filtroCategoria() === c.id) this.filtroCategoria.set(null);
    } catch (e) {
      this.toast('error', 'No se pudo eliminar', mensajeError(e, ''));
    }
  }

  private recargarCategorias(): void {
    this.productoService.categorias().subscribe((c) => this.categorias.set(c));
  }

  private toast(severity: 'success' | 'error', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
