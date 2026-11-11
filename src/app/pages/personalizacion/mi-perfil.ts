import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { ThemeService } from '../../services/theme.service';
import { FotoPerfilEditorComponent } from '../../components/foto-perfil-editor/foto-perfil-editor';
import { mensajeError } from '../../utils/http-error';

// Personalización > Mi perfil (todo el personal): foto, modo claro/nocturno y contraseña
@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [RouterLink, FotoPerfilEditorComponent],
  template: `
    <div class="flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header class="flex items-center gap-4">
        <span class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--marca-fondo) text-lg font-bold text-(--marca-texto)"
          aria-hidden="true">
          @if (perfil.foto(); as foto) {
            <img [src]="foto" alt="" class="h-full w-full object-cover" />
          } @else {
            {{ iniciales }}
          }
        </span>
        <div class="min-w-0">
          <h1 class="text-xl font-bold text-gray-900 dark:text-zinc-100">Mi perfil</h1>
          <p class="truncate text-sm text-gray-500 dark:text-zinc-400">{{ usuario }} · {{ rol }}</p>
        </div>
      </header>

      <section class="tarjeta flex flex-col gap-3 p-5" aria-labelledby="titulo-foto">
        <h2 id="titulo-foto" class="text-sm font-semibold text-gray-900 dark:text-zinc-100">Foto de perfil</h2>
        <app-foto-perfil-editor [iniciales]="iniciales" />
      </section>

      <section class="tarjeta flex flex-col gap-3 p-5" aria-labelledby="titulo-modo">
        <div>
          <h2 id="titulo-modo" class="text-sm font-semibold text-gray-900 dark:text-zinc-100">Modo</h2>
          <p class="text-xs text-gray-500 dark:text-zinc-400">Solo cambia tu vista; se guarda en tu cuenta.</p>
        </div>
        <div role="radiogroup" aria-labelledby="titulo-modo" class="grid max-w-sm grid-cols-2 gap-2">
          @for (m of modos; track m.oscuro) {
            <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 has-checked:border-gray-900 has-checked:bg-gray-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gray-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-800">
              <input type="radio" name="modo" class="sr-only" [checked]="theme.dark() === m.oscuro" (change)="cambiarModo(m.oscuro)" />
              <i [class]="m.icono + ' text-base!'" aria-hidden="true"></i>
              {{ m.nombre }}
            </label>
          }
        </div>
        @if (error(); as e) {
          <p role="alert" class="text-sm font-medium text-red-600 dark:text-red-400">{{ e }}</p>
        }
      </section>

      <section class="tarjeta flex flex-wrap items-center justify-between gap-3 p-5" aria-labelledby="titulo-seguridad">
        <div>
          <h2 id="titulo-seguridad" class="text-sm font-semibold text-gray-900 dark:text-zinc-100">Contraseña</h2>
          <p class="text-xs text-gray-500 dark:text-zinc-400">Inicias sesión con {{ usuario }}.</p>
        </div>
        <a routerLink="/cambiar-contrasena" [queryParams]="{ volver: '/personalizacion/perfil' }"
          class="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <i class="pi pi-key text-sm!" aria-hidden="true"></i>
          Cambiar contraseña
        </a>
      </section>
    </div>
  `,
})
export class MiPerfilComponent {
  protected readonly perfil = inject(PerfilService);
  protected readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);

  protected readonly usuario = this.auth.getUsername();
  protected readonly rol = this.auth.getRol();
  protected readonly iniciales = this.usuario.slice(0, 2).toUpperCase();
  protected readonly modos = [
    { nombre: 'Claro', oscuro: false, icono: 'pi pi-sun' },
    { nombre: 'Nocturno', oscuro: true, icono: 'pi pi-moon' },
  ];
  protected readonly error = signal<string | null>(null);

  protected async cambiarModo(oscuro: boolean): Promise<void> {
    this.error.set(null);
    try {
      await this.perfil.cambiarTema(oscuro);
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo guardar el modo. Inténtalo de nuevo.'));
    }
  }
}
