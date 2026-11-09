import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EntrenadorService } from '../../../services/entrenador.service';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { ResumenEntrenador } from '../../../models/entrenador.model';
import { CargaComponent } from '../../../components/carga/carga';
import { mensajeError } from '../../../utils/http-error';

@Component({
  selector: 'app-entrenador-perfil',
  standalone: true,
  imports: [RouterLink, CargaComponent],
  template: `
    @if (resumen(); as r) {
      <div class="flex flex-col gap-4 lg:max-w-2xl lg:gap-6">
        <header class="flex items-center gap-4">
          <span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-800 dark:bg-red-950/60 dark:text-red-300" aria-hidden="true">{{ iniciales() }}</span>
          <div class="min-w-0">
            <h1 class="truncate text-2xl font-bold text-gray-900 dark:text-zinc-100">{{ r.nombre }}</h1>
            <p class="text-sm text-gray-500 dark:text-zinc-400">Entrenador</p>
          </div>
        </header>

        <dl class="tarjeta divide-y divide-gray-100 px-5 py-1 text-sm dark:divide-zinc-800">
          <div class="flex justify-between gap-4 py-3"><dt class="text-gray-500 dark:text-zinc-400">Usuario</dt><dd class="font-medium text-gray-900 dark:text-zinc-100">{{ usuario }}</dd></div>
          <div class="flex justify-between gap-4 py-3"><dt class="text-gray-500 dark:text-zinc-400">Clientes asignados</dt><dd class="font-medium tabular-nums text-gray-900 dark:text-zinc-100">{{ r.clientesAsignados }}</dd></div>
          <div class="flex justify-between gap-4 py-3"><dt class="text-gray-500 dark:text-zinc-400">Controles este mes</dt><dd class="font-medium tabular-nums text-gray-900 dark:text-zinc-100">{{ r.controlesMes }}</dd></div>
        </dl>

        <div class="flex flex-wrap gap-3">
          <button type="button" (click)="theme.toggle()"
            class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <i class="pi text-sm!" [class.pi-moon]="!theme.dark()" [class.pi-sun]="theme.dark()" aria-hidden="true"></i>
            {{ theme.dark() ? 'Usar modo claro' : 'Usar modo oscuro' }}
          </button>
          <a routerLink="/cambiar-contrasena" [queryParams]="{ volver: '/entrenador/perfil' }"
            class="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <i class="pi pi-key text-sm!" aria-hidden="true"></i>
            Cambiar contraseña
          </a>
          <button type="button" (click)="salir()"
            class="flex cursor-pointer items-center gap-2 rounded-md border border-red-700 bg-white px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-400 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40">
            <i class="pi pi-sign-out text-sm!" aria-hidden="true"></i>
            Cerrar sesión
          </button>
        </div>
      </div>
    } @else {
      <app-carga [error]="error()" (reintentar)="cargar()" />
    }
  `,
})
export class EntrenadorPerfilComponent {
  private readonly service = inject(EntrenadorService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  protected readonly usuario = this.auth.getUsername();
  protected readonly resumen = signal<ResumenEntrenador | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly iniciales = computed(() =>
    (this.resumen()?.nombre ?? '')
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase(),
  );

  constructor() {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.error.set(null);
    try {
      this.resumen.set(await firstValueFrom(this.service.resumen()));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo cargar tu perfil. Inténtalo de nuevo.'));
    }
  }

  protected salir(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
