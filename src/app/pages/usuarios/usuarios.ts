import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { Rol, Usuario, UsuarioRequest } from '../../models/admin.model';
import { mensajeError } from '../../utils/http-error';

/**
 * Caso de uso "Gestionar usuarios y roles" (Administrador): personal del gimnasio.
 * Los usuarios de clientes se crean y gestionan desde Clientes.
 */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    ToggleSwitchModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
  ],
  providers: [MessageService],
  templateUrl: './usuarios.html',
})
export class UsuariosComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  readonly usuarioActual = inject(AuthService).getUsername();

  readonly usuarios = signal<Usuario[]>([]);
  readonly roles = signal<Rol[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroRol = signal<number | null>(null);
  readonly usuariosFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const rol = this.filtroRol();
    return this.usuarios().filter(
      (u) =>
        (rol === null || u.idRol === rol) &&
        (!texto || `${this.nombreCompleto(u)} ${u.usuario} ${u.correo} ${u.dni}`.toLowerCase().includes(texto)),
    );
  });

  // Alta / edición
  readonly formVisible = signal(false);
  readonly editando = signal<Usuario | null>(null);
  readonly guardando = signal(false);
  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoMaterno: ['', Validators.maxLength(100)],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    celular: ['', Validators.pattern(/^9\d{8}$/)],
    usuario: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._@-]{3,100}$/)]],
    idRol: [0, Validators.min(1)],
    contrasena: ['', [Validators.minLength(8), Validators.maxLength(72)]],
  });

  // Restablecer contraseña
  readonly claveVisible = signal(false);
  readonly usuarioClave = signal<Usuario | null>(null);
  nuevaClave = '';
  readonly guardandoClave = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [usuarios, roles] = await Promise.all([
        firstValueFrom(this.usuarioService.listar()),
        firstValueFrom(this.usuarioService.roles()),
      ]);
      this.usuarios.set(usuarios);
      this.roles.set(roles);
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar los usuarios.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- Alta / edición ----------

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset();
    this.form.controls.contrasena.addValidators(Validators.required);
    this.form.controls.contrasena.updateValueAndValidity();
    this.formVisible.set(true);
  }

  abrirEditar(u: Usuario): void {
    this.editando.set(u);
    this.form.reset({
      nombre: u.nombre,
      apellidoPaterno: u.apellidoPaterno ?? '',
      apellidoMaterno: u.apellidoMaterno ?? '',
      dni: u.dni,
      correo: u.correo,
      celular: u.celular ?? '',
      usuario: u.usuario,
      idRol: u.idRol,
      contrasena: '',
    });
    this.form.controls.contrasena.removeValidators(Validators.required);
    this.form.controls.contrasena.updateValueAndValidity();
    this.formVisible.set(true);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const actual = this.editando();
    const datos: UsuarioRequest = {
      nombre: v.nombre.trim(),
      apellidoPaterno: v.apellidoPaterno.trim(),
      apellidoMaterno: v.apellidoMaterno.trim() || null,
      dni: v.dni.trim(),
      correo: v.correo.trim(),
      celular: v.celular.trim() || null,
      usuario: v.usuario.trim(),
      idRol: v.idRol,
      contrasena: actual ? null : v.contrasena,
    };

    this.guardando.set(true);
    try {
      const usuario = actual
        ? await firstValueFrom(this.usuarioService.actualizar(actual.id, datos))
        : await firstValueFrom(this.usuarioService.crear(datos));
      this.usuarios.update((l) => (actual ? l.map((x) => (x.id === usuario.id ? usuario : x)) : [...l, usuario]));
      this.toast('success', actual ? 'Usuario actualizado' : 'Usuario creado',
        actual ? usuario.usuario : `${usuario.usuario} ya puede iniciar sesión con la contraseña indicada.`);
      this.formVisible.set(false);
      this.recargarRoles();
    } catch (e) {
      this.toast('error', 'No se pudo guardar', mensajeError(e, 'Revisa los datos.'));
    } finally {
      this.guardando.set(false);
    }
  }

  // ---------- Activar / desactivar ----------

  async cambiarEstado(u: Usuario, estado: boolean): Promise<void> {
    try {
      const actualizado = await firstValueFrom(this.usuarioService.cambiarEstado(u.id, estado));
      this.usuarios.update((l) => l.map((x) => (x.id === u.id ? actualizado : x)));
      this.toast('success', estado ? 'Usuario activado' : 'Usuario desactivado',
        estado ? `${u.usuario} puede volver a iniciar sesión.` : `${u.usuario} ya no podrá iniciar sesión.`);
    } catch (e) {
      this.toast('error', 'No se pudo cambiar el estado', mensajeError(e, ''));
      this.cargar();
    }
  }

  // ---------- Contraseña ----------

  abrirClave(u: Usuario): void {
    this.usuarioClave.set(u);
    this.nuevaClave = '';
    this.claveVisible.set(true);
  }

  async guardarClave(): Promise<void> {
    const u = this.usuarioClave();
    if (!u || this.nuevaClave.length < 8) return;
    this.guardandoClave.set(true);
    try {
      await firstValueFrom(this.usuarioService.restablecerContrasena(u.id, this.nuevaClave));
      this.claveVisible.set(false);
      this.toast('success', 'Contraseña restablecida', `Comunícale a ${u.usuario} su nueva contraseña.`);
    } catch (e) {
      this.toast('error', 'No se pudo restablecer', mensajeError(e, ''));
    } finally {
      this.guardandoClave.set(false);
    }
  }

  // ---------- Helpers ----------

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  nombreCompleto(u: Usuario): string {
    return [u.nombre, u.apellidoPaterno, u.apellidoMaterno].filter(Boolean).join(' ');
  }

  severidadRol(rol: string): 'danger' | 'info' | 'success' | 'secondary' {
    const r = rol.toLowerCase();
    if (r === 'administrador' || r === 'soporte tecnico') return 'danger';
    if (r === 'recepcionista') return 'info';
    if (r === 'entrenador') return 'success';
    return 'secondary';
  }

  private recargarRoles(): void {
    this.usuarioService.roles().subscribe((r) => this.roles.set(r));
  }

  private toast(severity: 'success' | 'error', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 5000 });
  }
}
