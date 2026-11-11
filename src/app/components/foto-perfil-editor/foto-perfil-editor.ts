import { Component, inject, input, signal } from '@angular/core';
import { PerfilService } from '../../services/perfil.service';
import { ErrorFoto, FOTO_RECOMENDACION, FOTO_TIPOS } from '../../utils/foto-perfil';
import { mensajeError } from '../../utils/http-error';

// Foto de perfil del usuario con sesión (cualquier rol): vista previa, subir/cambiar y quitar
@Component({
  selector: 'app-foto-perfil-editor',
  standalone: true,
  template: `
    <div class="flex items-center gap-4">
      <span class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xl font-bold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
        @if (perfil.foto(); as foto) {
          <img [src]="foto" alt="Tu foto de perfil" class="h-full w-full object-cover" />
        } @else {
          <span aria-hidden="true">{{ iniciales() }}</span>
        }
      </span>
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex flex-wrap gap-2">
          <label
            class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-gray-500 has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <i [class]="ocupado() ? 'pi pi-spinner pi-spin text-sm!' : 'pi pi-upload text-sm!'" aria-hidden="true"></i>
            {{ perfil.foto() ? 'Cambiar foto' : 'Subir foto' }}
            <input type="file" class="sr-only" [accept]="tipos" [disabled]="ocupado()" (change)="elegir($event)" />
          </label>
          @if (perfil.foto()) {
            <button
              type="button"
              (click)="quitar()"
              [disabled]="ocupado()"
              class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Quitar
            </button>
          }
        </div>
        <p class="text-xs text-gray-500 dark:text-zinc-400">{{ recomendacion }}</p>
        @if (error(); as e) {
          <p role="alert" class="text-xs font-medium text-red-600 dark:text-red-400">{{ e }}</p>
        }
      </div>
    </div>
  `,
})
export class FotoPerfilEditorComponent {
  protected readonly perfil = inject(PerfilService);

  readonly iniciales = input('');

  protected readonly recomendacion = FOTO_RECOMENDACION;
  protected readonly tipos = FOTO_TIPOS.join(',');
  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async elegir(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    // Permite volver a elegir el mismo archivo
    entrada.value = '';
    if (!archivo) return;
    await this.ejecutar(() => this.perfil.subirFoto(archivo), 'No se pudo subir la foto. Inténtalo de nuevo.');
  }

  protected async quitar(): Promise<void> {
    await this.ejecutar(() => this.perfil.quitarFoto(), 'No se pudo quitar la foto. Inténtalo de nuevo.');
  }

  private async ejecutar(accion: () => Promise<void>, mensaje: string): Promise<void> {
    this.ocupado.set(true);
    this.error.set(null);
    try {
      await accion();
    } catch (e) {
      this.error.set(e instanceof ErrorFoto ? e.message : mensajeError(e, mensaje));
    } finally {
      this.ocupado.set(false);
    }
  }
}
