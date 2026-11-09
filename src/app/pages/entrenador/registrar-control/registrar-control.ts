import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { BotonPrincipalComponent } from '../../../components/botones';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { EntrenadorService } from '../../../services/entrenador.service';
import { DetalleClienteAsignado } from '../../../models/entrenador.model';
import { CargaComponent } from '../../../components/carga/carga';
import { nombreCompleto } from '../../../utils/membresia-estado';
import { fechaIso, mensajeError } from '../../../utils/http-error';

type Campo = 'fecha' | 'peso';

// Fecha entre el registro del cliente y hoy (el backend vuelve a validarlo con la hora de Lima)
function fechaEnRango(min: () => string, max: string) {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const valor = control.value;
    if (!valor) return null;
    if (valor > max) return { futura: true };
    if (valor < min()) return { anterior: true };
    return null;
  };
}

// Control de peso: solo fecha y peso, sin comentarios
@Component({
  selector: 'app-registrar-control',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink, BotonPrincipalComponent, InputTextModule, MessageModule, CargaComponent],
  templateUrl: './registrar-control.html',
})
export class RegistrarControlComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EntrenadorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);

  private readonly idCliente = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly hoy = fechaIso(new Date());
  protected readonly detalle = signal<DetalleClienteAsignado | null>(null);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorGuardar = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly enviado = signal(false);

  protected readonly nombre = computed(() => {
    const d = this.detalle();
    return d ? nombreCompleto(d.cliente) : '';
  });
  protected readonly fechaMinima = computed(() => {
    const d = this.detalle();
    return d ? fechaIso(new Date(d.fechaRegistro)) : '';
  });

  protected readonly form = this.fb.nonNullable.group({
    fecha: [this.hoy, [Validators.required, fechaEnRango(() => this.fechaMinima(), this.hoy)]],
    peso: [null as number | null, [Validators.required, Validators.min(20), Validators.max(400)]],
  });

  constructor() {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.errorCarga.set(null);
    try {
      this.detalle.set(await firstValueFrom(this.service.detalle(this.idCliente)));
      this.form.controls.fecha.updateValueAndValidity();
    } catch (e) {
      this.errorCarga.set(mensajeError(e, 'No se pudo cargar al cliente. Inténtalo de nuevo.'));
    }
  }

  protected mostrarError(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected async guardar(): Promise<void> {
    if (this.guardando()) return;
    this.enviado.set(true);
    this.errorGuardar.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fecha, peso } = this.form.getRawValue();
    this.guardando.set(true);
    try {
      // Hasta 2 decimales, como la columna de la base de datos
      await firstValueFrom(this.service.registrarControl(this.idCliente, { fecha, peso: Math.round(peso! * 100) / 100 }));
      this.messages.add({ severity: 'success', summary: 'Control registrado', detail: `${this.nombre()} ya puede verlo en su portal.`, life: 3500 });
      await this.router.navigate(['/entrenador/clientes', this.idCliente]);
    } catch (e) {
      this.errorGuardar.set(mensajeError(e, 'No se pudo registrar el control. Inténtalo de nuevo.'));
    } finally {
      this.guardando.set(false);
    }
  }
}
