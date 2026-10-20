import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { InputPasswordModule } from 'primeng/inputpassword';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Eye } from '@primeicons/angular/eye';
import { EyeSlash } from '@primeicons/angular/eye-slash';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../services/auth.service';
import { mensajeError } from '../../utils/http-error';

type Campo = 'correo' | 'password';

@Component({
  selector: 'app-login',
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
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly enviado = signal(false);
  mask = true;

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Errores solo si el campo fue tocado o se intentó enviar
  mostrarError(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  async onSubmit(): Promise<void> {
    if (this.loading()) {
      return;
    }
    this.enviado.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { correo, password } = this.form.getRawValue();

    try {
      // El backend acepta el correo en el campo username
      await firstValueFrom(this.authService.login({ username: correo.trim(), password }));
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'No se pudo iniciar sesión',
        detail: this.detalleError(error),
        life: 4000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  private detalleError(error: unknown): string {
    if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
      return 'Correo o contraseña incorrectos.';
    }
    return mensajeError(error, 'Ocurrió un error inesperado. Inténtalo de nuevo.');
  }
}
