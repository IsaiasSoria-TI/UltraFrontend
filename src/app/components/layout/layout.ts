import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <app-sidebar />
    <!-- Se reserva el ancho del sidebar expandido (16rem): al abrirse no tapa ni mueve el contenido -->
    <main class="min-h-screen bg-white pl-64 dark:bg-zinc-950">
      <router-outlet />
    </main>
  `,
})
export class LayoutComponent {}
