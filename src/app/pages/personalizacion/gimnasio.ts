import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PerfilService } from '../../services/perfil.service';
import { BotonCancelarComponent, BotonPrincipalComponent } from '../../components/botones';
import { RuedaColorComponent } from '../../components/rueda-color/rueda-color';
import { COLORES_SUGERIDOS, TONOS, contraste, esHexValido, fondoMarca, paleta, textoSobre } from '../../utils/marca';
import { mensajeError } from '../../utils/http-error';

const NOMBRE_MIN = 2;
const NOMBRE_MAX = 60;

/**
 * Personalización > Gimnasio (solo administrador): nombre y color base de la marca, elegido con la
 * rueda de color. La paleta y el color del texto se derivan del color base. Lo ven todo el personal
 * (menú lateral y barra superior), los entrenadores y los clientes (cabecera de sus portales).
 */
@Component({
  selector: 'app-personalizacion-gimnasio',
  standalone: true,
  imports: [DecimalPipe, InputTextModule, BotonCancelarComponent, BotonPrincipalComponent, RuedaColorComponent],
  template: `
    <div class="flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 class="text-xl font-bold text-gray-900 dark:text-zinc-100">Gimnasio</h1>
        <p class="text-sm text-gray-500 dark:text-zinc-400">
          Nombre y colores de tu gimnasio. Los ven todo el personal, los entrenadores y los clientes.
        </p>
      </header>

      <section class="tarjeta flex flex-col gap-2 p-5" aria-labelledby="titulo-nombre">
        <h2 id="titulo-nombre" class="text-sm font-semibold text-gray-900 dark:text-zinc-100">Nombre del gimnasio</h2>
        <input pInputText id="nombre-gimnasio" aria-labelledby="titulo-nombre" aria-describedby="ayuda-nombre"
          class="w-full max-w-md" [attr.maxlength]="nombreMax" autocomplete="organization"
          [value]="nombre()" (input)="editarNombre($event)" [invalid]="nombreInvalido()" />
        <small id="ayuda-nombre" class="text-xs" [class]="nombreInvalido() ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-zinc-400'">
          @if (nombreInvalido()) {
            Debe tener entre {{ nombreMin }} y {{ nombreMax }} caracteres.
          } @else {
            Aparece en el menú lateral, la barra superior, los portales y los mensajes. {{ nombre().trim().length }}/{{ nombreMax }}
          }
        </small>
      </section>

      <section class="tarjeta flex flex-col gap-5 p-5" aria-labelledby="titulo-color">
        <div>
          <h2 id="titulo-color" class="text-sm font-semibold text-gray-900 dark:text-zinc-100">Color base</h2>
          <p class="text-xs text-gray-500 dark:text-zinc-400">
            Elige el color en la rueda, ajusta el brillo o escribe su código. Con él se genera la paleta del gimnasio.
          </p>
        </div>

        <app-rueda-color [(valor)]="color" />

        <div class="flex flex-col gap-2">
          <h3 id="titulo-sugeridos" class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Sugeridos</h3>
          <div class="flex flex-wrap gap-2" role="group" aria-labelledby="titulo-sugeridos">
            @for (s of sugeridos; track s.hex) {
              <button type="button" (click)="color.set(s.hex)" [attr.aria-pressed]="color() === s.hex"
                [attr.aria-label]="s.nombre" [title]="s.nombre"
                class="h-8 w-8 cursor-pointer rounded-full ring-offset-2 ring-offset-white aria-pressed:ring-2 aria-pressed:ring-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:ring-offset-zinc-900 dark:aria-pressed:ring-zinc-100"
                [style.background-color]="s.hex"></button>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Paleta generada</h3>
          <ol class="grid grid-cols-6 gap-1.5 sm:grid-cols-11" aria-label="Tonos de la paleta, del más claro al más oscuro">
            @for (t of tonos(); track t.tono) {
              <li class="flex flex-col items-center gap-1">
                <span class="h-10 w-full rounded-md border border-black/5 dark:border-white/10" [class.ring-2]="t.tono === '500'"
                  [class.ring-gray-900]="t.tono === '500'" [class.dark:ring-zinc-100]="t.tono === '500'"
                  [style.background-color]="t.color" [title]="t.color"></span>
                <span class="text-[0.65rem] tabular-nums text-gray-500 dark:text-zinc-400">{{ t.tono === '500' ? 'Base' : t.tono }}</span>
              </li>
            }
          </ol>
        </div>
      </section>

      <section class="tarjeta flex flex-col gap-3 p-5" aria-labelledby="titulo-vista">
        <h2 id="titulo-vista" class="text-sm font-semibold text-gray-900 dark:text-zinc-100">Vista previa del menú</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          @for (v of vistas(); track v.titulo) {
            <figure class="flex flex-col gap-1.5">
              <div class="flex flex-col gap-1 rounded-lg p-3 shadow-sm" [style.background-color]="v.fondo" [style.color]="v.texto">
                <div class="flex items-center gap-2 pb-1">
                  <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#F5A623" /></svg>
                  <span class="truncate text-sm font-black uppercase tracking-tight">{{ nombre().trim() || 'Tu gimnasio' }}</span>
                </div>
                <span class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium" [style.background-color]="v.activo">
                  <i class="pi pi-th-large text-xs!" aria-hidden="true"></i>Dashboard
                </span>
                <span class="flex items-center gap-2 px-2 py-1.5 text-xs opacity-85">
                  <i class="pi pi-users text-xs!" aria-hidden="true"></i>Clientes
                </span>
              </div>
              <figcaption class="text-xs text-gray-500 dark:text-zinc-400">
                {{ v.titulo }} · texto {{ v.texto === '#ffffff' ? 'blanco' : 'oscuro' }}, contraste {{ v.contraste | number: '1.1-1' }}:1
              </figcaption>
            </figure>
          }
        </div>
        <p class="text-xs text-gray-500 dark:text-zinc-400">
          El texto del menú cambia solo a blanco u oscuro para que siempre se lea bien.
        </p>
      </section>

      <div class="flex flex-wrap items-center justify-end gap-3">
        @if (error(); as e) {
          <p role="alert" class="mr-auto text-sm font-medium text-red-600 dark:text-red-400">{{ e }}</p>
        } @else if (guardado()) {
          <p role="status" class="mr-auto text-sm text-gray-600 dark:text-zinc-300"><i class="pi pi-check mr-1 text-xs!" aria-hidden="true"></i>Cambios guardados.</p>
        }
        <app-boton-cancelar texto="Descartar" [deshabilitado]="!hayCambios() || guardando()" (clic)="descartar()" />
        <app-boton-principal texto="Guardar cambios" icono="pi pi-check" [cargando]="guardando()"
          [deshabilitado]="!hayCambios() || nombreInvalido() || !colorValido()" (clic)="guardar()" />
      </div>
    </div>
  `,
})
export class PersonalizacionGimnasioComponent {
  protected readonly perfil = inject(PerfilService);

  protected readonly nombreMin = NOMBRE_MIN;
  protected readonly nombreMax = NOMBRE_MAX;
  protected readonly sugeridos = COLORES_SUGERIDOS;

  protected readonly nombre = signal('');
  protected readonly color = signal('#7f1d1d');
  // Mientras no se edita, el formulario sigue a lo guardado (el perfil puede llegar después)
  private readonly editado = signal(false);
  protected readonly guardando = signal(false);
  protected readonly guardado = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly colorValido = computed(() => esHexValido(this.color()));
  protected readonly nombreInvalido = computed(() => {
    const largo = this.nombre().trim().length;
    return largo < NOMBRE_MIN || largo > NOMBRE_MAX;
  });
  protected readonly hayCambios = computed(
    () => this.nombre().trim() !== this.perfil.nombreGimnasio() || this.color() !== this.perfil.colorGimnasio(),
  );
  protected readonly tonos = computed(() =>
    this.colorValido() ? Object.entries(paleta(this.color())).map(([tono, color]) => ({ tono, color })) : [],
  );
  protected readonly vistas = computed(() =>
    [
      { titulo: 'Modo claro', oscuro: false },
      { titulo: 'Modo nocturno', oscuro: true },
    ].map(({ titulo, oscuro }) => {
      const fondo = fondoMarca(this.colorValido() ? this.color() : '#7f1d1d', oscuro);
      const texto = textoSobre(fondo);
      // Ítem activo: una capa del color del texto al 15 %, como en el menú real
      const activo = `color-mix(in srgb, ${texto} 15%, transparent)`;
      return { titulo, fondo, texto, activo, contraste: contraste(fondo, texto) };
    }),
  );

  constructor() {
    effect(() => {
      const nombre = this.perfil.nombreGimnasio();
      const color = this.perfil.colorGimnasio();
      if (this.editado()) return;
      this.nombre.set(nombre);
      this.color.set(color);
    });
    // Cualquier cambio de color en la rueda cuenta como edición
    effect(() => {
      if (this.color() !== this.perfil.colorGimnasio()) this.editado.set(true);
    });
  }

  protected editarNombre(e: Event): void {
    this.editado.set(true);
    this.guardado.set(false);
    this.nombre.set((e.target as HTMLInputElement).value);
  }

  protected descartar(): void {
    this.editado.set(false);
    this.error.set(null);
    this.nombre.set(this.perfil.nombreGimnasio());
    this.color.set(this.perfil.colorGimnasio());
  }

  protected async guardar(): Promise<void> {
    if (this.nombreInvalido() || !this.colorValido()) return;
    this.guardando.set(true);
    this.error.set(null);
    this.guardado.set(false);
    try {
      await this.perfil.actualizarGimnasio({ nombre: this.nombre().trim(), colorBase: this.color() });
      this.editado.set(false);
      this.guardado.set(true);
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron guardar los cambios. Inténtalo de nuevo.'));
    } finally {
      this.guardando.set(false);
    }
  }
}
