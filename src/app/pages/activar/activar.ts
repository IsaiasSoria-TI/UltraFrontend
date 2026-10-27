import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { InputPasswordModule } from 'primeng/inputpassword';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Eye } from '@primeicons/angular/eye';
import { EyeSlash } from '@primeicons/angular/eye-slash';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../services/auth.service';
import { ValidacionToken } from '../../models/acceso.model';
import { mensajeError } from '../../utils/http-error';
import { nombreDocumento } from '../../utils/documento';

type Estado = 'cargando' | 'invalido' | 'formulario' | 'exito';

// Mismas reglas que el backend
const PATRON_CLAVE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

function clavesIguales(grupo: AbstractControl): ValidationErrors | null {
  const { password, confirmacion } = grupo.value as { password: string; confirmacion: string };
  return confirmacion && password !== confirmacion ? { distintas: true } : null;
}

/**
 * Página pública a la que llega el cliente desde WhatsApp: confirma su documento y crea
 * (o restablece) su contraseña. Pensada para celular.
 */
@Component({
  selector: 'app-activar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    InputPasswordModule,
    IconFieldModule,
    InputIconModule,
    Eye,
    EyeSlash,
    ButtonModule,
    MessageModule,
    SkeletonModule,
  ],
  templateUrl: './activar.html',
  styleUrls: ['../login/login.css'],
})
export class ActivarComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  private token = '';
  readonly estado = signal<Estado>('cargando');
  readonly datos = signal<ValidacionToken | null>(null);
  readonly guardando = signal(false);
  readonly enviado = signal(false);
  readonly error = signal<string | null>(null);
  mask = true;
  maskConfirmacion = true;

  readonly form = this.fb.nonNullable.group(
    {
      numeroDocumento: ['', Validators.required],
      password: ['', [Validators.required, Validators.pattern(PATRON_CLAVE)]],
      confirmacion: ['', Validators.required],
    },
    { validators: clavesIguales },
  );

  private readonly clave = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  readonly requisitos = computed(() => {
    const clave = this.clave();
    return [
      { texto: 'Al menos 8 caracteres', cumple: clave.length >= 8 },
      { texto: 'Al menos una letra', cumple: /[A-Za-z]/.test(clave) },
      { texto: 'Al menos un número', cumple: /\d/.test(clave) },
    ];
  });

  readonly esRestablecimiento = computed(() => this.datos()?.tipo === 'RESTABLECIMIENTO');
  readonly etiquetaDocumento = computed(() => nombreDocumento(this.datos()?.tipoDocumento));

  async ngOnInit(): Promise<void> {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.estado.set('invalido');
      return;
    }
    try {
      const r = await firstValueFrom(this.authService.validarActivacion(this.token));
      this.datos.set(r);
      this.estado.set(r.valido ? 'formulario' : 'invalido');
    } catch (e) {
      // Sin conexión no es lo mismo que un enlace vencido
      if (e instanceof HttpErrorResponse && e.status === 0) {
        this.error.set(mensajeError(e, ''));
        this.estado.set('formulario');
        return;
      }
      this.estado.set('invalido');
    }
  }

  mostrarError(campo: 'numeroDocumento' | 'password' | 'confirmacion'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  confirmacionDistinta(): boolean {
    const control = this.form.controls.confirmacion;
    return this.form.hasError('distintas') && (control.touched || this.enviado());
  }

  async activar(): Promise<void> {
    if (this.guardando()) return;
    this.enviado.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const v = this.form.getRawValue();
    try {
      await firstValueFrom(
        this.authService.activar({
          token: this.token,
          numeroDocumento: v.numeroDocumento.trim().toUpperCase(),
          password: v.password,
          confirmacion: v.confirmacion,
        }),
      );
      this.estado.set('exito');
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo guardar tu contraseña. Inténtalo de nuevo.'));
    } finally {
      this.guardando.set(false);
    }
  }
}
