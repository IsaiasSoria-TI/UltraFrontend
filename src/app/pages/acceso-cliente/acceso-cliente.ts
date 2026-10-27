import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { InputPasswordModule } from 'primeng/inputpassword';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Eye } from '@primeicons/angular/eye';
import { EyeSlash } from '@primeicons/angular/eye-slash';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../services/auth.service';
import { TipoDocumento } from '../../models/acceso.model';
import { mensajeError } from '../../utils/http-error';
import { TIPOS_DOCUMENTO, documentoSegunTipo, maxLongitudDocumento, mensajeDocumento } from '../../utils/documento';

type Campo = 'numeroDocumento' | 'password';

// Login de clientes: tipo + número de documento y la contraseña que crearon con su enlace
@Component({
  selector: 'app-acceso-cliente',
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
    SelectModule,
  ],
  templateUrl: './acceso-cliente.html',
  styleUrls: ['../login/login.css'],
})
export class AccesoClienteComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly enviado = signal(false);
  readonly error = signal<{ severidad: 'error' | 'warn'; texto: string } | null>(null);
  readonly bienvenida = signal<string | null>(null);
  mask = true;

  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly tipoSeleccionado = signal<TipoDocumento>('DNI');
  readonly mensajeDocumento = mensajeDocumento;
  readonly maxLongitudDocumento = maxLongitudDocumento;

  readonly form = this.fb.nonNullable.group({
    tipoDocumento: ['DNI' as TipoDocumento, Validators.required],
    numeroDocumento: ['', [Validators.required, documentoSegunTipo()]],
    password: ['', Validators.required],
  });

  constructor() {
    this.form.controls.tipoDocumento.valueChanges.pipe(takeUntilDestroyed()).subscribe((tipo) => {
      this.tipoSeleccionado.set(tipo);
      this.form.controls.numeroDocumento.updateValueAndValidity();
    });
  }

  mostrarError(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  async onSubmit(): Promise<void> {
    if (this.loading()) return;
    this.enviado.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { tipoDocumento, numeroDocumento, password } = this.form.getRawValue();
    try {
      await firstValueFrom(
        this.authService.loginCliente({ tipoDocumento, numeroDocumento: numeroDocumento.trim().toUpperCase(), password }),
      );
      this.bienvenida.set('Iniciaste sesión correctamente.');
      this.form.reset();
      this.enviado.set(false);
    } catch (e) {
      this.error.set(this.detalleError(e));
    } finally {
      this.loading.set(false);
    }
  }

  // 403 = cuenta pendiente de activación, 423 = bloqueada; ambos traen el mensaje del backend
  private detalleError(error: unknown): { severidad: 'error' | 'warn'; texto: string } {
    const aviso = error instanceof HttpErrorResponse && (error.status === 403 || error.status === 423);
    return {
      severidad: aviso ? 'warn' : 'error',
      texto: mensajeError(error, 'Ocurrió un error inesperado. Inténtalo de nuevo.'),
    };
  }
}
