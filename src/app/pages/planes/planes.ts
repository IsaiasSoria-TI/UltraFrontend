import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { MembresiaService } from '../../services/membresia.service';
import { Plan } from '../../models/membresia.model';
import { mensajeError } from '../../utils/http-error';

// Caso de uso "Gestionar planes de membresía" (Administrador)
@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './planes.html',
})
export class PlanesComponent implements OnInit {
  private readonly membresiaService = inject(MembresiaService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  readonly planes = signal<Plan[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly editando = signal<Plan | null>(null);
  readonly guardando = signal(false);
  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    precio: [null as number | null, [Validators.required, Validators.min(0.01)]],
    duracionDias: [null as number | null, [Validators.required, Validators.min(1), Validators.max(3650)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.planes.set(await firstValueFrom(this.membresiaService.planes()));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar los planes.'));
    } finally {
      this.loading.set(false);
    }
  }

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset();
    this.formVisible.set(true);
  }

  abrirEditar(plan: Plan): void {
    this.editando.set(plan);
    this.form.reset({ nombre: plan.nombre, precio: plan.precio, duracionDias: plan.duracionDias });
    this.formVisible.set(true);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = { nombre: v.nombre!.trim(), precio: v.precio!, duracionDias: v.duracionDias! };

    this.guardando.set(true);
    try {
      const actual = this.editando();
      if (actual) {
        const plan = await firstValueFrom(this.membresiaService.actualizarPlan(actual.id, datos));
        this.planes.update((l) => l.map((p) => (p.id === plan.id ? plan : p)));
        this.toast('success', 'Plan actualizado', `${plan.nombre} se actualizó. Las membresías ya vendidas no cambian.`);
      } else {
        const plan = await firstValueFrom(this.membresiaService.crearPlan(datos));
        this.planes.update((l) => [...l, plan].sort((a, b) => a.precio - b.precio));
        this.toast('success', 'Plan creado', `${plan.nombre} ya está disponible para la venta.`);
      }
      this.formVisible.set(false);
    } catch (e) {
      this.toast('error', 'No se pudo guardar', mensajeError(e, 'Revisa los datos.'));
    } finally {
      this.guardando.set(false);
    }
  }

  confirmarEliminacion(plan: Plan): void {
    this.confirmationService.confirm({
      header: 'Eliminar plan',
      message: `Se eliminará el plan ${plan.nombre}. Solo es posible si nunca se vendió.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: async () => {
        try {
          await firstValueFrom(this.membresiaService.eliminarPlan(plan.id));
          this.planes.update((l) => l.filter((p) => p.id !== plan.id));
          this.toast('success', 'Plan eliminado', `${plan.nombre} se eliminó.`);
        } catch (e) {
          this.toast('error', 'No se pudo eliminar', mensajeError(e, ''));
        }
      },
    });
  }

  invalido(campo: 'nombre' | 'precio' | 'duracionDias'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  // Precio por día: ayuda a comparar planes
  porDia(plan: Plan): number {
    return plan.precio / plan.duracionDias;
  }

  private toast(severity: 'success' | 'error', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
