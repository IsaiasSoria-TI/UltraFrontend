import { Component, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { BotonCancelarComponent, BotonPrincipalComponent, BotonSecundarioComponent, BotonTextoComponent } from '../botones';
import { EnlaceAccesoComponent } from '../enlace-acceso/enlace-acceso';
import { ClienteService } from '../../services/cliente.service';
import { Cliente, ClienteRequest } from '../../models/cliente.model';
import { AccesoCliente, TipoDocumento } from '../../models/acceso.model';
import { esNoEncontrado, mensajeError } from '../../utils/http-error';
import {
  TIPOS_DOCUMENTO,
  abreviaturaDocumento,
  documentoSegunTipo,
  maxLongitudDocumento,
  mensajeDocumento,
} from '../../utils/documento';
import { autocompletarDni } from '../../utils/autocompletar-dni';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

/**
 * Paso "Buscar cliente" de los diagramas de venta (por correo o número de documento). Con
 * [permitirRegistro], si el cliente no existe ofrece registrarlo (se genera su enlace de
 * activación para WhatsApp) y continúa con él. El componente padre debe proveer MessageService.
 */
@Component({
  selector: 'app-buscar-cliente',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DialogModule, IconFieldModule, InputIconModule, InputTextModule, MessageModule, SelectModule, TagModule, BotonCancelarComponent, BotonPrincipalComponent, BotonSecundarioComponent, BotonTextoComponent, EnlaceAccesoComponent],
  template: `
    @if (cliente(); as c) {
      <div class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-zinc-800">
        <div class="flex min-w-0 items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-800 dark:bg-red-950/60 dark:text-red-300" aria-hidden="true">
            {{ (c.nombre.charAt(0) + (c.apellidoPaterno?.charAt(0) ?? '')).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">{{ nombreCompleto(c) }}</p>
            <p class="truncate text-xs text-gray-500 dark:text-zinc-400">
              {{ abreviaturaDocumento(c.tipoDocumento) }} {{ c.dni }}{{ c.correo ? ' · ' + c.correo : '' }}
            </p>
          </div>
        </div>
        <app-boton-texto texto="Cambiar" (clic)="limpiar()" />
      </div>
    } @else {
      <form class="flex gap-2" (ngSubmit)="buscar()" novalidate>
        <input pInputText type="text" name="busqueda" class="min-w-0 flex-1" placeholder="N.° de documento o correo"
          aria-label="Número de documento o correo del cliente" autocomplete="off" [(ngModel)]="busqueda" />
        <app-boton-secundario texto="Buscar" icono="pi pi-search" [cargando]="buscando()" [deshabilitado]="!busqueda.trim()" tipo="submit" />
      </form>
      @if (noEncontrado()) {
        <p-message severity="warn" class="mt-2 block">
          <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
            No existe un cliente con ese documento o correo.
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
          <label for="rc-tipoDocumento" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Tipo de documento *</label>
          <p-select inputId="rc-tipoDocumento" formControlName="tipoDocumento" [options]="tiposDocumento" optionLabel="label"
            optionValue="value" appendTo="body" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <label for="rc-numeroDocumento" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Número de documento *</label>
            @if (dni.disponible()) {
              <button type="button" (click)="dni.consultar()" [disabled]="!dni.puedeConsultar()"
                class="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-red-800 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline dark:text-red-400 dark:disabled:text-zinc-600"
                [attr.aria-label]="'Consultar datos del DNI'" title="Autocompletar nombre y apellidos con el DNI">
                <i [class]="dni.consultando() ? 'pi pi-spinner pi-spin' : 'pi pi-search'" class="text-xs!" aria-hidden="true"></i>
                Consultar
              </button>
            }
          </div>
          <p-iconfield class="w-full">
            <input pInputText id="rc-numeroDocumento" formControlName="numeroDocumento" autocomplete="off" class="w-full"
              [attr.inputmode]="tipoSeleccionado() === 'DNI' ? 'numeric' : 'text'" [maxlength]="maxLongitudDocumento(tipoSeleccionado())"
              [invalid]="invalido('numeroDocumento')" [attr.aria-busy]="dni.consultando()" />
            @if (dni.consultando()) {
              <p-inputicon class="pi pi-spinner pi-spin" aria-label="Buscando datos del DNI" />
            }
          </p-iconfield>
          @if (invalido('numeroDocumento')) {
            <small class="text-red-600 dark:text-red-400">
              {{ form.controls.numeroDocumento.hasError('required') ? 'El número de documento es obligatorio.' : mensajeDocumento(tipoSeleccionado()) }}
            </small>
          } @else if (dni.aviso(); as a) {
            @if (a.tipo === 'autocompletado') {
              <small class="text-gray-500 dark:text-zinc-400"><i class="pi pi-check mr-1 text-xs!" aria-hidden="true"></i>{{ a.texto }}</small>
            } @else if (a.tipo === 'registrado') {
              <small class="text-amber-700 dark:text-amber-400">
                {{ a.texto }}.
                <button type="button" class="cursor-pointer font-semibold underline" (click)="usarClienteExistente()">Usar este cliente</button>
              </small>
            } @else {
              <small class="text-amber-700 dark:text-amber-400">{{ a.texto }}</small>
            }
          } @else if (dni.consultando()) {
            <small class="text-gray-500 dark:text-zinc-400">Buscando datos del DNI…</small>
          }
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rc-nombre" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Nombre *</label>
          <input pInputText id="rc-nombre" formControlName="nombre" autocomplete="off" [invalid]="invalido('nombre')" />
          @if (invalido('nombre')) {
            <small class="text-red-600 dark:text-red-400">El nombre es obligatorio.</small>
          }
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rc-apellidoPaterno" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Apellido paterno *</label>
          <input pInputText id="rc-apellidoPaterno" formControlName="apellidoPaterno" autocomplete="off" [invalid]="invalido('apellidoPaterno')" />
          @if (invalido('apellidoPaterno')) {
            <small class="text-red-600 dark:text-red-400">El apellido paterno es obligatorio.</small>
          }
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rc-apellidoMaterno" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Apellido materno</label>
          <input pInputText id="rc-apellidoMaterno" formControlName="apellidoMaterno" autocomplete="off" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rc-celular" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Celular *</label>
          <input pInputText id="rc-celular" formControlName="celular" inputmode="tel" maxlength="9" autocomplete="off" [invalid]="invalido('celular')" />
          @if (invalido('celular')) {
            <small class="text-red-600 dark:text-red-400">
              {{ form.controls.celular.hasError('required') ? 'El celular es obligatorio.' : '9 dígitos, empezando con 9.' }}
            </small>
          } @else {
            <small class="text-gray-500 dark:text-zinc-400">Recibirá por WhatsApp el enlace de activación.</small>
          }
        </div>
        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label for="rc-correo" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Correo</label>
          <input pInputText id="rc-correo" type="email" formControlName="correo" autocomplete="off" [invalid]="invalido('correo')" />
          @if (invalido('correo')) {
            <small class="text-red-600 dark:text-red-400">Ingresa un correo válido.</small>
          } @else {
            <small class="text-gray-500 dark:text-zinc-400">Opcional.</small>
          }
        </div>
      </form>
      <ng-template #footer>
        <app-boton-cancelar (clic)="registroVisible.set(false)" />
        <app-boton-principal texto="Registrar" icono="pi pi-check" [cargando]="registrando()" (clic)="registrar()" />
      </ng-template>
    </p-dialog>

    <app-enlace-acceso [(visible)]="accesoVisible" [(acceso)]="acceso" />
  `,
})
export class BuscarClienteComponent {
  private readonly clienteService = inject(ClienteService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly permitirRegistro = input(false);
  readonly seleccionado = output<Cliente | null>();

  busqueda = '';
  readonly cliente = signal<Cliente | null>(null);
  readonly buscando = signal(false);
  readonly noEncontrado = signal(false);

  readonly registroVisible = signal(false);
  readonly registrando = signal(false);
  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoMaterno: ['', Validators.maxLength(100)],
    tipoDocumento: ['DNI' as TipoDocumento, Validators.required],
    numeroDocumento: ['', [Validators.required, documentoSegunTipo()]],
    correo: ['', [Validators.email, Validators.maxLength(150)]],
    celular: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
  });
  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly tipoSeleccionado = signal<TipoDocumento>('DNI');
  readonly dni = autocompletarDni(this.form, () => this.registroVisible());

  // Enlace de activación del cliente recién registrado (solo se muestra en el modal)
  readonly accesoVisible = signal(false);
  readonly acceso = signal<AccesoCliente | null>(null);

  readonly abreviaturaDocumento = abreviaturaDocumento;
  readonly mensajeDocumento = mensajeDocumento;
  readonly maxLongitudDocumento = maxLongitudDocumento;

  constructor() {
    this.form.controls.tipoDocumento.valueChanges.pipe(takeUntilDestroyed()).subscribe((tipo) => {
      this.tipoSeleccionado.set(tipo);
      this.form.controls.numeroDocumento.updateValueAndValidity();
    });
  }

  async buscar(): Promise<void> {
    const texto = this.busqueda.trim();
    if (!texto) return;

    this.buscando.set(true);
    this.noEncontrado.set(false);
    try {
      this.elegir(await firstValueFrom(this.clienteService.buscar(texto)));
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

  // Precarga lo que se buscó: correo si tiene "@", si no el número de documento
  abrirRegistro(): void {
    const texto = this.busqueda.trim();
    this.form.reset(texto.includes('@') ? { correo: texto } : { numeroDocumento: texto.toUpperCase() });
    this.registroVisible.set(true);
  }

  // El DNI que se intentaba registrar ya es de un cliente: se busca y se continúa con él
  usarClienteExistente(): void {
    this.busqueda = this.form.controls.numeroDocumento.value.trim();
    this.registroVisible.set(false);
    this.buscar();
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
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento.trim().toUpperCase(),
      correo: v.correo.trim() || null,
      celular: v.celular.trim(),
      observaciones: null,
    };

    this.registrando.set(true);
    try {
      const r = await firstValueFrom(this.clienteService.registrar(datos));
      this.registroVisible.set(false);
      if (r.acceso) {
        this.acceso.set(r.acceso);
        this.accesoVisible.set(true);
      } else {
        this.messageService.add({ severity: 'success', summary: 'Cliente registrado', detail: r.mensaje, life: 7000 });
      }
      this.busqueda = r.cliente.dni;
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
