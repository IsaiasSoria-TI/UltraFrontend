import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

export interface OpcionPortal {
  label: string;
  ruta: string;
  icono: string;
  // true para la pantalla de inicio: solo se marca activa en su ruta exacta
  exacta?: boolean;
}

/**
 * Marco de los portales de clientes y entrenadores (diseño de Figma): cabecera roja con el menú en
 * escritorio y barra inferior en móvil. El contenido de 976 px va centrado.
 */
@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="fixed inset-x-0 top-0 z-40 bg-red-900 text-white shadow-md dark:bg-red-950">
      <div class="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 lg:h-16 lg:px-6">
        <svg class="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#F5A623" />
        </svg>
        <span class="text-base font-black uppercase tracking-tight">Ultratech</span>
        @if (etiqueta()) {
          <span class="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">{{ etiqueta() }}</span>
        }

        <nav class="ml-6 hidden items-center gap-1 lg:flex" aria-label="Menú principal">
          @for (o of opciones(); track o.ruta) {
            <a
              [routerLink]="o.ruta"
              routerLinkActive="bg-white/15 text-white!"
              [routerLinkActiveOptions]="{ exact: !!o.exacta }"
              ariaCurrentWhenActive="page"
              class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-100 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white/60"
            >
              <i [class]="o.icono + ' text-sm!'" aria-hidden="true"></i>{{ o.label }}
            </a>
          }
        </nav>

        <span class="flex-1"></span>
        <button
          type="button"
          (click)="theme.toggle()"
          [attr.aria-label]="theme.dark() ? 'Usar modo claro' : 'Usar modo oscuro'"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/60"
        >
          <i class="pi" [class.pi-moon]="!theme.dark()" [class.pi-sun]="theme.dark()" aria-hidden="true"></i>
        </button>
        <a
          [routerLink]="rutaPerfil()"
          aria-label="Mi perfil"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          {{ iniciales() }}
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

  readonly opciones = input.required<OpcionPortal[]>();
  readonly iniciales = input('');
  readonly rutaPerfil = input.required<string>();
  // Texto junto a la marca (por ejemplo, "Entrenador")
  readonly etiqueta = input<string | null>(null);
}
