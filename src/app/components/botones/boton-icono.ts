import { Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

type Severidad = 'secondary' | 'danger' | undefined;

// Icono y color de cada acción: la misma acción se ve igual en todas las tablas
const ACCIONES = {
  ver: { icono: 'pi pi-eye', severidad: 'secondary' },
  editar: { icono: 'pi pi-pencil', severidad: 'secondary' },
  eliminar: { icono: 'pi pi-trash', severidad: 'danger' },
  anular: { icono: 'pi pi-ban', severidad: 'danger' },
  quitar: { icono: 'pi pi-times', severidad: 'secondary' },
  confirmar: { icono: 'pi pi-check', severidad: undefined },
  actualizar: { icono: 'pi pi-refresh', severidad: 'secondary' },
  clave: { icono: 'pi pi-key', severidad: 'secondary' },
  correo: { icono: 'pi pi-envelope', severidad: 'secondary' },
  asignar: { icono: 'pi pi-user-edit', severidad: 'secondary' },
} satisfies Record<string, { icono: string; severidad: Severidad }>;

export type AccionIcono = keyof typeof ACCIONES;

/**
 * Botón de solo icono para acciones de fila. [etiqueta] es obligatoria: es lo que lee
 * el lector de pantalla, ya que no hay texto visible.
 */
@Component({
  selector: 'app-boton-icono',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  template: `
    <button pButton type="button" [iconOnly]="true" [text]="true" [rounded]="true"
      [severity]="config().severidad" [pTooltip]="tooltip()" tooltipPosition="top"
      [attr.aria-label]="etiqueta()" [disabled]="deshabilitado()" (click)="clic.emit()">
      <i [class]="config().icono" aria-hidden="true"></i>
    </button>
  `,
})
export class BotonIconoComponent {
  readonly accion = input.required<AccionIcono>();
  readonly etiqueta = input.required<string>();
  readonly tooltip = input<string>();
  readonly deshabilitado = input(false);
  readonly clic = output<void>();

  protected readonly config = computed(() => ACCIONES[this.accion()]);
}
