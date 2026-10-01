import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ClienteService } from '../../services/cliente.service';
import { Cliente, ClienteRequest } from '../../models/cliente.model';
import { esNoEncontrado, mensajeError } from '../../utils/http-error';

/**
 * Paso "Buscar cliente por correo" de los diagramas de venta. Con [permitirRegistro], si el
 * cliente no existe ofrece registrarlo (se le envía la contraseña temporal) y continúa con él.
 * El componente padre debe proveer MessageService.
 */
@Component({
  selector: 'app-buscar-cliente',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ButtonModule, DialogModule, InputTextModule, MessageModule, TagModule],
  template: `
    @if (cliente(); as c) {
      <div class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-zinc-800">
        <div class="flex min-w-0 items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-800 dark:bg-red-950/60 dark:text-red-300" aria-hidden="true">
            {{ (c.nombre.charAt(0) + (c.apellidoPaterno?.charAt(0) ?? '')).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">{{ nombreCompleto(c) }}</p>
            <p class="truncate text-xs text-gray-500 dark:text-zinc-400">{{ c.correo }} · DNI {{ c.dni }}</p>
          </div>
        </div>
        <p-button label="Cambiar" [text]="true" size="small" severity="secondary" (onClick)="limpiar()" />
      </div>
    } @else {
      <form class="flex gap-2" (ngSubmit)="buscar()" novalidate>
        <input pInputText type="email" name="correo" class="min-w-0 flex-1" placeholder="correo@ejemplo.com"
          aria-label="Correo del cliente" autocomplete="off" [(ngModel)]="correo" />
        <p-button type="submit" icon="pi pi-search" label="Buscar" severity="secondary" [outlined]="true"
          [loading]="buscando()" [disabled]="!correo.trim()" />
      </form>
      @if (noEncontrado()) {
        <p-message severity="warn" class="mt-2 block">
          <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
            No existe un cliente con ese correo.
            @if (permitirRegistro()) {
              <button type="button" class="cursor-pointer font-semibold underline" (click)="abrirRegistro()">Registrar cliente</button>
            }
          </span>
        </p-message>
      }
    }

    <p-dialog [(visible)]="registroVisible" header="Registrar cliente" [modal]="true" [draggable]="false"
      [style]="{ width: '36rem' }" [breakpoints]="{ '640px': '95vw' }" appendTo="body">
      <form [formGroup]="form" (ngSubmit)="registrar()" class="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2" novalidate>
        <div class="flex flex-col gap-1.5">
          <label for="rc-nombre" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Nombre *</label>
          <input pInputText id="rc-nombre" formControlName="nombre" autocomplete="off" [invalid]="invalido('nombre')" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rc-apellidoPaterno" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Apellido paterno *</label>
          <input pInputText id="rc-apellidoPaterno" formControlName="apellidoPaterno" autocomplete="off" [invalid]="invalido('apellidoPaterno')" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rc-apellidoMaterno" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Apellido materno</label>
          <input pInputText id="rc-apellidoMaterno" formControlName="apellidoMaterno" autocomplete="off" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rc-dni" class="text-sm font-medium text-gray-700 dark:text-zinc-300">DNI *</label>
          <input pInputText id="rc-dni" formControlName="dni" inputmode="numeric" maxlength="8" autocomplete="off" [invalid]="invalido('dni')" />
          @if (invalido('dni')) {
            <small class="text-red-600 dark:text-red-400">Debe tener 8 dígitos.</small>
          }
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rc-correo" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Correo *</label>
          <input pInputText id="rc-correo" type="email" formControlName="correo" autocomplete="off" [invalid]="invalido('correo')" />
          <small class="text-gray-500 dark:text-zinc-400">Recibirá ahí su contraseña temporal.</small>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rc-celular" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Celular</label>
          <input pInputText id="rc-celular" formControlName="celular" inputmode="tel" maxlength="9" autocomplete="off" [invalid]="invalido('celular')" />
          @if (invalido('celular')) {
            <small class="text-red-600 dark:text-red-400">9 dígitos, empezando con 9.</small>
          }
        </div>
      </form>
      <ng-template #footer>
        <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="registroVisible.set(false)" />
        <p-button label="Registrar" icon="pi pi-check" [loading]="registrando()" (onClick)="registrar()"
          styleClass="bg-red-800! border-red-800! hover:bg-red-900! hover:border-red-900! text-white!" />
      </ng-template>
    </p-dialog>
  `,
})
export class BuscarClienteComponent {
  private readonly clienteService = inject(ClienteService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly permitirRegistro = input(false);
  readonly seleccionado = output<Cliente | null>();

  correo = '';
  readonly cliente = signal<Cliente | null>(null);
  readonly buscando = signal(false);
  readonly noEncontrado = signal(false);

  readonly registroVisible = signal(false);
  readonly registrando = signal(false);
  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoMaterno: ['', Validators.maxLength(100)],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    celular: ['', Validators.pattern(/^9\d{8}$/)],
  });

  async buscar(): Promise<void> {
    const correo = this.correo.trim();
    if (!correo) return;

    this.buscando.set(true);
    this.noEncontrado.set(false);
    try {
      this.elegir(await firstValueFrom(this.clienteService.buscarPorCorreo(correo)));
    } catch (e) {
      if (esNoEncontrado(e)) {
        this.noEncontrado.set(true);
      } else {
        this.messageService.add({ severity: 'error', summary: 'No se pudo buscar', detail: mensajeError(e, ''), life: 4000 });
      }
    } finally {
      this.buscando.set(false);
    }
  }

  limpiar(): void {
    this.cliente.set(null);
    this.noEncontrado.set(false);
    this.seleccionado.emit(null);
  }

  abrirRegistro(): void {
    this.form.reset({ correo: this.correo.trim() });
    this.registroVisible.set(true);
  }

  async registrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos: ClienteRequest = {
      nombre: v.nombre.trim(),
      apellidoPaterno: v.apellidoPaterno.trim(),
      apellidoMaterno: v.apellidoMaterno.trim() || null,
      dni: v.dni.trim(),
      correo: v.correo.trim(),
      celular: v.celular.trim() || null,
      observaciones: null,
    };

    this.registrando.set(true);
    try {
      const r = await firstValueFrom(this.clienteService.registrar(datos));
      this.registroVisible.set(false);
      this.messageService.add({
        severity: r.usuarioCreado && !r.correoEnviado ? 'warn' : 'success',
        summary: 'Cliente registrado',
        detail: r.mensaje,
        life: 7000,
      });
      this.correo = r.cliente.correo;
      this.elegir(r.cliente);
    } catch (e) {
      this.messageService.add({ severity: 'error', summary: 'No se pudo registrar', detail: mensajeError(e, 'Revisa los datos.'), life: 5000 });
    } finally {
      this.registrando.set(false);
    }
  }

  invalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  nombreCompleto(c: Cliente): string {
    return [c.nombre, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(' ');
  }

  private elegir(cliente: Cliente): void {
    this.noEncontrado.set(false);
    this.cliente.set(cliente);
    this.seleccionado.emit(cliente);
  }
}
