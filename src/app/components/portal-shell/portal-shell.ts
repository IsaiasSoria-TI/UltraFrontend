import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { PerfilService } from '../../services/perfil.service';

export interface OpcionPortal {
  label: string;
  ruta: string;
  icono: string;
  // true para la pantalla de inicio: solo se marca activa en su ruta exacta
  exacta?: boolean;
}

/**
 * Marco de los portales de clientes y entrenadores (diseño de Figma): cabecera con el color del gimnasio y el menú en
 * escritorio y barra inferior en móvil. El contenido de 976 px va centrado.
 */
@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="fixed inset-x-0 top-0 z-40 bg-(--marca-fondo) text-(--marca-texto) shadow-md">
      <div class="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 lg:h-16 lg:px-6">
        <svg class="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#F5A623" />
        </svg>
        <span class="min-w-0 truncate text-base font-black uppercase tracking-tight">{{ perfil.nombreGimnasio() }}</span>
        @if (etiqueta()) {
          <span class="ml-1 rounded-full bg-(--marca-texto)/15 px-2 py-0.5 text-xs font-semibold">{{ etiqueta() }}</span>
        }

        <nav class="ml-6 hidden items-center gap-1 lg:flex" aria-label="Menú principal">
          @for (o of opciones(); track o.ruta) {
            <a
              [routerLink]="o.ruta"
              routerLinkActive="bg-(--marca-texto)/15 text-(--marca-texto)!"
              [routerLinkActiveOptions]="{ exact: !!o.exacta }"
              ariaCurrentWhenActive="page"
              class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-(--marca-texto)/85 hover:bg-(--marca-texto)/10 hover:text-(--marca-texto) focus-visible:outline-2 focus-visible:outline-(--marca-texto)/60"
            >
              <i [class]="o.icono + ' text-sm!'" aria-hidden="true"></i>{{ o.label }}
            </a>
          }
        </nav>

        <span class="flex-1"></span>
        <button
          type="button"
          (click)="perfil.alternarTema()"
          [attr.aria-label]="theme.dark() ? 'Usar modo claro' : 'Usar modo oscuro'"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg hover:bg-(--marca-texto)/10 focus-visible:outline-2 focus-visible:outline-(--marca-texto)/60"
        >
          <i class="pi" [class.pi-moon]="!theme.dark()" [class.pi-sun]="theme.dark()" aria-hidden="true"></i>
        </button>
        <a
          [routerLink]="rutaPerfil()"
          aria-label="Mi perfil"
          class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--marca-texto) text-xs font-semibold text-(--marca-fondo) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--marca-texto)/60"
        >
          @if (perfil.foto(); as foto) {
            <img [src]="foto" alt="" class="h-full w-full object-cover" />
          } @else {
            {{ iniciales() }}
          }
        </a>
      </div>
    </header>

    <main class="min-h-dvh bg-gray-50 pb-24 pt-14 dark:bg-zinc-950 lg:pb-12 lg:pt-16">
      <div class="mx-auto w-full max-w-5xl px-4 py-5 lg:px-6 lg:py-8">
        <ng-content />
      </div>
    </main>

    <!-- Móvil y tablet: menú inferior -->
    <nav
      class="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-900 lg:hidden"
      aria-label="Menú principal"
    >
      @for (o of opciones(); track o.ruta) {
        <a
          [routerLink]="o.ruta"
          routerLinkActive="font-semibold text-red-800! dark:text-red-300!"
          [routerLinkActiveOptions]="{ exact: !!o.exacta }"
          ariaCurrentWhenActive="page"
          class="flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs text-gray-500 dark:text-zinc-400"
        >
          <i [class]="o.icono + ' text-lg!'" aria-hidden="true"></i>{{ o.label }}
        </a>
      }
    </nav>
  `,
})
export class PortalShellComponent {
  protected readonly theme = inject(ThemeService);
  // Color del gimnasio (lo define el administrador), modo y foto del usuario
  protected readonly perfil = inject(PerfilService);

  constructor() {
    this.perfil.asegurarCargado();
  }

  readonly opciones = input.required<OpcionPortal[]>();
  readonly iniciales = input('');
  readonly rutaPerfil = input.required<string>();
  // Texto junto a la marca (por ejemplo, "Entrenador")
  readonly etiqueta = input<string | null>(null);
}
