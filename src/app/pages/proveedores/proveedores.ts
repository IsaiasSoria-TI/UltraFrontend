import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { ProveedorService } from '../../services/proveedor.service';
import { Proveedor } from '../../models/compra.model';
import { mensajeError } from '../../utils/http-error';

// Caso de uso "Gestionar proveedores" (Administrador)
@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './proveedores.html',
})
export class ProveedoresComponent implements OnInit {
  private readonly proveedorService = inject(ProveedorService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  readonly proveedores = signal<Proveedor[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly proveedoresFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.proveedores().filter((p) => !texto || `${p.razonSocial} ${p.ruc ?? ''}`.toLowerCase().includes(texto));
  });

  readonly formVisible = signal(false);
  readonly editando = signal<Proveedor | null>(null);
  readonly guardando = signal(false);
  readonly form = this.fb.nonNullable.group({
    razonSocial: ['', [Validators.required, Validators.maxLength(150)]],
    ruc: ['', Validators.pattern(/^(10|15|17|20)\d{9}$/)],
    telefono: ['', Validators.pattern(/^\d{7,9}$/)],
  });

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.proveedores.set(await firstValueFrom(this.proveedorService.listar()));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar los proveedores.'));
    } finally {
      this.loading.set(false);
    }
  }

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset();
    this.formVisible.set(true);
  }

  abrirEditar(p: Proveedor): void {
    this.editando.set(p);
    this.form.reset({ razonSocial: p.razonSocial, ruc: p.ruc ?? '', telefono: p.telefono ?? '' });
    this.formVisible.set(true);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = { razonSocial: v.razonSocial.trim(), ruc: v.ruc.trim() || null, telefono: v.telefono.trim() || null };

    this.guardando.set(true);
    try {
      const actual = this.editando();
      const proveedor = actual
        ? await firstValueFrom(this.proveedorService.actualizar(actual.id, datos))
        : await firstValueFrom(this.proveedorService.crear(datos));
      this.proveedores.update((l) =>
        (actual ? l.map((p) => (p.id === proveedor.id ? proveedor : p)) : [...l, proveedor]).sort((a, b) =>
          a.razonSocial.localeCompare(b.razonSocial),
        ),
      );
      this.toast('success', actual ? 'Proveedor actualizado' : 'Proveedor creado', proveedor.razonSocial);
      this.formVisible.set(false);
    } catch (e) {
      this.toast('error', 'No se pudo guardar', mensajeError(e, 'Revisa los datos.'));
    } finally {
      this.guardando.set(false);
    }
  }

  confirmarEliminacion(p: Proveedor): void {
    this.confirmationService.confirm({
      header: 'Eliminar proveedor',
      message: `Se eliminará ${p.razonSocial}. Solo es posible si no tiene compras registradas.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: async () => {
        try {
          await firstValueFrom(this.proveedorService.eliminar(p.id));
          this.proveedores.update((l) => l.filter((x) => x.id !== p.id));
          this.toast('success', 'Proveedor eliminado', p.razonSocial);
        } catch (e) {
          this.toast('error', 'No se pudo eliminar', mensajeError(e, ''));
        }
      },
    });
  }

  invalido(campo: 'razonSocial' | 'ruc' | 'telefono'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  private toast(severity: 'success' | 'error', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
