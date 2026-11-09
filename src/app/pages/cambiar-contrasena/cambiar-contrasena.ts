import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InputPasswordModule } from 'primeng/inputpassword';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Eye } from '@primeicons/angular/eye';
import { EyeSlash } from '@primeicons/angular/eye-slash';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../services/auth.service';
import { mensajeError } from '../../utils/http-error';

type Campo = 'actual' | 'nueva' | 'confirmacion';

// Mismas reglas que el backend
const PATRON_CLAVE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

function clavesValidas(grupo: AbstractControl): ValidationErrors | null {
  const { actual, nueva, confirmacion } = grupo.value as Record<Campo, string>;
  if (confirmacion && nueva !== confirmacion) return { distintas: true };
  if (nueva && actual && nueva === actual) return { igualActual: true };
  return null;
}

/**
 * Cambio de contraseña de cualquier usuario con sesión. Si la contraseña es temporal (la creó el
 * administrador) el cambio es obligatorio: no hay "Cancelar" y el resto del sistema queda bloqueado.
 * ?volver=/ruta indica a dónde regresar en un cambio voluntario.
 */
@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, InputPasswordModule, IconFieldModule, InputIconModule, Eye, EyeSlash, ButtonModule, MessageModule],
  templateUrl: './cambiar-contrasena.html',
  styleUrls: ['../login/login.css'],
})
export class CambiarContrasenaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Solo rutas internas, para no redirigir fuera del sistema
  private readonly volver = (() => {
    const v = inject(ActivatedRoute).snapshot.queryParamMap.get('volver');
    return v && v.startsWith('/') && !v.startsWith('//') ? v : null;
  })();

  readonly obligatorio = this.auth.debeCambiarContrasena();
  readonly guardando = signal(false);
  readonly enviado = signal(false);
  readonly error = signal<string | null>(null);
  readonly listo = signal(false);
  mascaras: Record<Campo, boolean> = { actual: true, nueva: true, confirmacion: true };

  readonly form = this.fb.nonNullable.group(
    {
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.pattern(PATRON_CLAVE)]],
      confirmacion: ['', Validators.required],
    },
    { validators: clavesValidas },
  );

  private readonly clave = toSignal(this.form.controls.nueva.valueChanges, { initialValue: '' });
  readonly requisitos = computed(() => {
    const clave = this.clave();
    return [
      { texto: 'Al menos 8 caracteres', cumple: clave.length >= 8 },
      { texto: 'Al menos una letra', cumple: /[A-Za-z]/.test(clave) },
      { texto: 'Al menos un número', cumple: /\d/.test(clave) },
    ];
  });

  readonly campos: { campo: Campo; etiqueta: string; autocomplete: string }[] = [
    { campo: 'actual', etiqueta: this.obligatorio ? 'Contraseña temporal' : 'Contraseña actual', autocomplete: 'current-password' },
    { campo: 'nueva', etiqueta: 'Nueva contraseña', autocomplete: 'new-password' },
    { campo: 'confirmacion', etiqueta: 'Repite la nueva contraseña', autocomplete: 'new-password' },
  ];

  mostrarError(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  errorGrupo(campo: Campo): string | null {
    const control = this.form.controls[campo];
    if (!(control.touched || this.enviado())) return null;
    if (campo === 'confirmacion' && this.form.hasError('distintas')) return 'Las contraseñas no coinciden.';
    if (campo === 'nueva' && this.form.hasError('igualActual')) return 'Debe ser distinta de la contraseña actual.';
    return null;
  }

  mensajeCampo(campo: Campo): string {
    if (campo === 'actual') return 'Ingresa tu contraseña actual.';
    if (campo === 'confirmacion') return 'Repite la nueva contraseña.';
    return this.form.controls.nueva.hasError('required') ? 'Crea tu nueva contraseña.' : 'No cumple los requisitos.';
  }

  async guardar(): Promise<void> {
    if (this.guardando()) return;
    this.enviado.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    try {
      await firstValueFrom(this.auth.cambiarContrasena(this.form.getRawValue()));
      this.listo.set(true);
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo cambiar la contraseña. Inténtalo de nuevo.'));
    } finally {
      this.guardando.set(false);
    }
  }

  continuar(): void {
    void this.router.navigateByUrl(this.volver ?? this.auth.rutaInicio());
  }

  cancelar(): void {
    void this.router.navigateByUrl(this.volver ?? this.auth.rutaInicio());
  }

  salir(): void {
    const cliente = this.auth.esCliente();
    this.auth.logout();
    void this.router.navigate([cliente ? '/acceso-cliente' : '/login']);
  }
}
