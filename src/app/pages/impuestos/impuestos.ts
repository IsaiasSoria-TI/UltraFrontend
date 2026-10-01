import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { ImpuestoService } from '../../services/impuesto.service';
import { Impuesto } from '../../models/compra.model';
import { mensajeError } from '../../utils/http-error';

/**
 * Caso de uso "Gestionar impuestos" (Administrador). No se eliminan, se desactivan: las compras
 * ya registradas guardan su propio porcentaje.
 */
@Component({
  selector: 'app-impuestos',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ToggleSwitchModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
  ],
  providers: [MessageService],
  templateUrl: './impuestos.html',
})
export class ImpuestosComponent implements OnInit {
  private readonly impuestoService = inject(ImpuestoService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly impuestos = signal<Impuesto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly editando = signal<Impuesto | null>(null);
  readonly guardando = signal(false);
  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    porcentaje: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.impuestos.set(await firstValueFrom(this.impuestoService.listar()));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar los impuestos.'));
    } finally {
      this.loading.set(false);
    }
  }

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset();
    this.formVisible.set(true);
  }

  abrirEditar(i: Impuesto): void {
    this.editando.set(i);
    this.form.reset({ nombre: i.nombre, porcentaje: i.porcentaje });
    this.formVisible.set(true);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = { nombre: v.nombre!.trim(), porcentaje: v.porcentaje! };

    this.guardando.set(true);
    try {
      const actual = this.editando();
      const impuesto = actual
        ? await firstValueFrom(this.impuestoService.actualizar(actual.id, datos))
        : await firstValueFrom(this.impuestoService.crear(datos));
      this.reemplazar(impuesto, !actual);
      this.toast('success', actual ? 'Impuesto actualizado' : 'Impuesto creado', `${impuesto.nombre} (${impuesto.porcentaje}%)`);
      this.formVisible.set(false);
    } catch (e) {
      this.toast('error', 'No se pudo guardar', mensajeError(e, 'Revisa los datos.'));
    } finally {
      this.guardando.set(false);
    }
  }

  async cambiarEstado(i: Impuesto, estado: boolean): Promise<void> {
    try {
      this.reemplazar(await firstValueFrom(this.impuestoService.cambiarEstado(i.id, estado)), false);
      this.toast('success', estado ? 'Impuesto activado' : 'Impuesto desactivado',
        estado ? `${i.nombre} vuelve a estar disponible en compras.` : `${i.nombre} ya no aparecerá al registrar compras.`);
    } catch (e) {
      this.toast('error', 'No se pudo cambiar el estado', mensajeError(e, ''));
      this.cargar();
    }
  }

  invalido(campo: 'nombre' | 'porcentaje'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  private reemplazar(impuesto: Impuesto, nuevo: boolean): void {
    this.impuestos.update((l) =>
      (nuevo ? [...l, impuesto] : l.map((x) => (x.id === impuesto.id ? impuesto : x))).sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      ),
    );
  }

  private toast(severity: 'success' | 'error', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
