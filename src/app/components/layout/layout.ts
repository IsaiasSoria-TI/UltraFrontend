import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';

// Mismo corte que el prefijo lg: de Tailwind (64rem)
const CONSULTA_MOVIL = '(max-width: 63.99rem)';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  host: { '(document:keydown.escape)': 'menuAbierto.set(false)' },
  template: `
    <!-- Móvil y tablet: barra superior con el botón que abre el menú -->
    <header class="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 bg-red-900 px-3 text-white shadow-md dark:bg-red-950 lg:hidden">
      <button
        type="button"
        (click)="menuAbierto.set(true)"
        aria-label="Abrir menú"
        aria-controls="menu-principal"
        [attr.aria-expanded]="menuAbierto()"
        class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/60"
      >
        <i class="pi pi-bars text-lg!"></i>
      </button>
      <svg class="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#F5A623" />
      </svg>
      <span class="text-base font-black uppercase tracking-tight">Ultratech</span>
    </header>

    @if (menuAbierto()) {
      <div class="fixed inset-0 z-40 bg-black/50 lg:hidden" (click)="menuAbierto.set(false)" aria-hidden="true"></div>
    }

    <app-sidebar [abierto]="menuAbierto()" [movil]="movil()" (cerrar)="menuAbierto.set(false)" />

    <!-- Escritorio: se reserva el ancho del sidebar expandido (16rem); al abrirse no tapa ni mueve el contenido -->
    <main class="min-h-dvh bg-white pt-14 dark:bg-zinc-950 lg:pl-64 lg:pt-0">
      <router-outlet />
    </main>
  `,
})
export class LayoutComponent {
  readonly menuAbierto = signal(false);
  readonly movil = signal(false);

  constructor() {
    const consulta = window.matchMedia(CONSULTA_MOVIL);
    this.movil.set(consulta.matches);
    const alCambiar = (e: MediaQueryListEvent) => {
      this.movil.set(e.matches);
      // Al pasar a escritorio el panel deja de ser un overlay
      if (!e.matches) this.menuAbierto.set(false);
    };
    consulta.addEventListener('change', alCambiar);
    inject(DestroyRef).onDestroy(() => consulta.removeEventListener('change', alCambiar));
  }
}
