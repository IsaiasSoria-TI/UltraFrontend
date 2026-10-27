import { Component, computed, inject, input, model } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { AccesoCliente } from '../../models/acceso.model';

/**
 * Modal con el enlace de activación / restablecimiento recién generado. El enlace solo vive
 * aquí (no se guarda en ningún estado persistente). El componente padre debe proveer MessageService.
 */
@Component({
  selector: 'app-enlace-acceso',
  standalone: true,
  imports: [DatePipe, ButtonModule, DialogModule, MessageModule],
  template: `
    <p-dialog [(visible)]="visible" [header]="titulo()" [modal]="true" [draggable]="false"
      [style]="{ width: '28rem' }" [breakpoints]="{ '640px': '95vw' }" appendTo="body" (onHide)="acceso.set(null)">
      @if (acceso(); as a) {
        <div class="flex flex-col gap-5">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400" aria-hidden="true">
              <i class="pi pi-check text-lg!"></i>
            </span>
            <div class="min-w-0">
              <p class="truncate font-semibold text-gray-900 dark:text-zinc-100">{{ a.nombre }}</p>
              <p class="text-sm text-gray-500 dark:text-zinc-400">
                {{ a.tipo === 'ACTIVACION' ? 'Enlace para activar su cuenta y crear su contraseña' : 'Enlace para restablecer su contraseña' }}
              </p>
            </div>
          </div>

          @if (a.celular) {
            <div class="rounded-lg border border-gray-200 px-4 py-3 text-center dark:border-zinc-800">
              <p class="text-xs text-gray-500 dark:text-zinc-400">Confirma el celular con el cliente</p>
              <p class="mt-1 text-3xl font-bold tracking-wider tabular-nums text-gray-900 dark:text-zinc-100">{{ celularFormateado() }}</p>
            </div>
          } @else {
            <p-message severity="warn">
              El cliente no tiene celular registrado. Copia el enlace y envíaselo por otro medio.
            </p-message>
          }

          <p class="text-sm text-gray-600 dark:text-zinc-400">
            <i class="pi pi-clock mr-1 text-xs!" aria-hidden="true"></i>
            El enlace vence el <span class="font-medium text-gray-900 dark:text-zinc-100">{{ a.expiraEn | date: "dd/MM/yyyy 'a las' HH:mm" }}</span>
            y solo puede usarse una vez.
          </p>

          <div class="flex flex-col gap-2 sm:flex-row">
            @if (a.whatsappUrl) {
              <button pButton type="button" class="flex-1" severity="success" (click)="enviarWhatsapp(a.whatsappUrl)">
                <i class="pi pi-whatsapp" aria-hidden="true"></i>
                Enviar por WhatsApp
              </button>
            }
            <button pButton type="button" class="flex-1" severity="secondary" [outlined]="true" (click)="copiar(a.enlaceActivacion)">
              <i class="pi pi-copy" aria-hidden="true"></i>
              Copiar enlace
            </button>
          </div>
        </div>
      }
    </p-dialog>
  `,
})
export class EnlaceAccesoComponent {
  private readonly messageService = inject(MessageService);

  readonly visible = model(false);
  readonly acceso = model<AccesoCliente | null>(null);
  readonly titulo = input('Cliente registrado');

  protected readonly celularFormateado = computed(() =>
    (this.acceso()?.celular ?? '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'),
  );

  enviarWhatsapp(url: string): void {
    window.open(url, '_blank', 'noopener');
  }

  async copiar(enlace: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(enlace);
      this.messageService.add({ severity: 'success', summary: 'Enlace copiado', detail: 'Pégalo en el chat del cliente.', life: 3000 });
    } catch {
      this.messageService.add({ severity: 'error', summary: 'No se pudo copiar', detail: 'Tu navegador bloqueó el portapapeles.', life: 4000 });
    }
  }
}
