import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { ClienteService } from '../../services/cliente.service';
import { Cliente, ClienteDetalle, ClienteRequest, Entrenador, MembresiaCliente } from '../../models/cliente.model';

type FiltroMembresia = 'todos' | 'con' | 'sin';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    SelectButtonModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './clientes.html',
})
export class ClientesComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  readonly clientes = signal<Cliente[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Filtros
  readonly busqueda = signal('');
  readonly filtroMembresia = signal<FiltroMembresia>('todos');
  readonly opcionesFiltro = [
    { label: 'Todos', value: 'todos' },
    { label: 'Con membresía', value: 'con' },
    { label: 'Sin membresía', value: 'sin' },
  ];

  readonly clientesFiltrados = computed(() => {
    const texto = this.normalizar(this.busqueda());
    const filtro = this.filtroMembresia();
    return this.clientes().filter((c) => {
      if (filtro === 'con' && !c.membresia) return false;
      if (filtro === 'sin' && c.membresia) return false;
      if (!texto) return true;
      return this.normalizar(`${this.nombreCompleto(c)} ${c.dni} ${c.correo} ${c.celular ?? ''}`).includes(texto);
    });
  });

  readonly totalConMembresia = computed(() => this.clientes().filter((c) => c.membresia).length);

  // Formulario registrar / editar
  readonly formVisible = signal(false);
  readonly editando = signal<Cliente | null>(null);
  readonly guardando = signal(false);
  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoMaterno: ['', Validators.maxLength(100)],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    celular: ['', Validators.pattern(/^9\d{8}$/)],
    observaciones: ['', Validators.maxLength(255)],
  });

  // Detalle
  readonly detalleVisible = signal(false);
  readonly detalle = signal<ClienteDetalle | null>(null);
  readonly cargandoDetalle = signal(false);

  // Asignar entrenador
  readonly entrenadorVisible = signal(false);
  readonly entrenadores = signal<Entrenador[]>([]);
  readonly clienteEntrenador = signal<Cliente | null>(null);
  entrenadorSeleccionado: number | null = null;
  readonly asignando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.clientes.set(await firstValueFrom(this.clienteService.listar()));
    } catch (e) {
      this.error.set(this.mensajeError(e, 'No se pudieron cargar los clientes.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- Registrar / editar ----------

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset();
    this.formVisible.set(true);
  }

  abrirEditar(cliente: Cliente): void {
    this.editando.set(cliente);
    this.form.reset({
      nombre: cliente.nombre,
      apellidoPaterno: cliente.apellidoPaterno ?? '',
      apellidoMaterno: cliente.apellidoMaterno ?? '',
      dni: cliente.dni,
      correo: cliente.correo,
      celular: cliente.celular ?? '',
      observaciones: cliente.observaciones ?? '',
    });
    this.formVisible.set(true);
  }

  async guardar(): Promise<void> {
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
      observaciones: v.observaciones.trim() || null,
    };

    this.guardando.set(true);
    try {
      const actual = this.editando();
      if (actual) {
        const actualizado = await firstValueFrom(this.clienteService.actualizar(actual.id, datos));
        // La membresía no viene en la respuesta de edición: se conserva la del listado
        this.reemplazar({ ...actualizado, membresia: actual.membresia });
        this.toast('success', 'Cliente actualizado', `${this.nombreCompleto(actualizado)} se actualizó correctamente.`);
      } else {
        const r = await firstValueFrom(this.clienteService.registrar(datos));
        this.clientes.update((lista) => [r.cliente, ...lista]);
        this.toast(r.usuarioCreado && !r.correoEnviado ? 'warn' : 'success', 'Cliente registrado', r.mensaje, 7000);
      }
      this.formVisible.set(false);
    } catch (e) {
      this.toast('error', 'No se pudo guardar', this.mensajeError(e, 'Revisa los datos e inténtalo de nuevo.'));
    } finally {
      this.guardando.set(false);
    }
  }

  campoInvalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  // ---------- Detalle ----------

  async verDetalle(cliente: Cliente): Promise<void> {
    this.detalle.set(null);
    this.detalleVisible.set(true);
    this.cargandoDetalle.set(true);
    try {
      this.detalle.set(await firstValueFrom(this.clienteService.obtener(cliente.id)));
    } catch (e) {
      this.detalleVisible.set(false);
      this.toast('error', 'No se pudo cargar el cliente', this.mensajeError(e, ''));
    } finally {
      this.cargandoDetalle.set(false);
    }
  }

  // ---------- Reenviar contraseña ----------

  confirmarReenvio(cliente: Cliente): void {
    this.confirmationService.confirm({
      header: 'Reenviar contraseña temporal',
      message: `Se generará una nueva contraseña temporal y se enviará a ${cliente.correo}. La anterior dejará de funcionar.`,
      icon: 'pi pi-envelope',
      acceptLabel: 'Reenviar',
      rejectLabel: 'Cancelar',
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.reenviar(cliente),
    });
  }

  private async reenviar(cliente: Cliente): Promise<void> {
    try {
      await firstValueFrom(this.clienteService.reenviarClave(cliente.id));
      this.toast('success', 'Contraseña enviada', `Se envió una nueva contraseña temporal a ${cliente.correo}.`);
    } catch (e) {
      this.toast('error', 'No se pudo reenviar', this.mensajeError(e, 'Inténtalo más tarde.'));
    }
  }

  // ---------- Asignar entrenador ----------

  async abrirEntrenador(cliente: Cliente): Promise<void> {
    this.clienteEntrenador.set(cliente);
    this.entrenadorSeleccionado = cliente.entrenador?.id ?? null;
    this.entrenadorVisible.set(true);
    try {
      this.entrenadores.set(await firstValueFrom(this.clienteService.listarEntrenadores()));
    } catch (e) {
      this.toast('error', 'No se pudieron cargar los entrenadores', this.mensajeError(e, ''));
    }
  }

  async guardarEntrenador(): Promise<void> {
    const cliente = this.clienteEntrenador();
    if (!cliente) return;

    this.asignando.set(true);
    try {
      const actualizado = await firstValueFrom(
        this.clienteService.asignarEntrenador(cliente.id, this.entrenadorSeleccionado),
      );
      this.reemplazar({ ...actualizado, membresia: cliente.membresia });
      this.entrenadorVisible.set(false);
      this.toast(
        'success',
        'Entrenador actualizado',
        actualizado.entrenador
          ? `${actualizado.entrenador.nombre} fue asignado a ${this.nombreCompleto(actualizado)}.`
          : `${this.nombreCompleto(actualizado)} ya no tiene entrenador asignado.`,
      );
    } catch (e) {
      this.toast('error', 'No se pudo asignar', this.mensajeError(e, ''));
    } finally {
      this.asignando.set(false);
    }
  }

  // ---------- Helpers de vista ----------

  nombreCompleto(c: Pick<Cliente, 'nombre' | 'apellidoPaterno' | 'apellidoMaterno'>): string {
    return [c.nombre, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(' ');
  }

  iniciales(c: Cliente): string {
    return `${c.nombre.charAt(0)}${c.apellidoPaterno?.charAt(0) ?? ''}`.toUpperCase();
  }

  severidadMembresia(m: MembresiaCliente): 'success' | 'info' | 'secondary' | 'danger' {
    switch (m.estado) {
      case 'activo':
        return 'success';
      case 'programado':
        return 'info';
      case 'cancelado':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  etiquetaMembresia(estado: MembresiaCliente['estado']): string {
    return { activo: 'Activa', programado: 'Programada', vencido: 'Vencida', cancelado: 'Cancelada' }[estado];
  }

  private reemplazar(cliente: Cliente): void {
    this.clientes.update((lista) => lista.map((c) => (c.id === cliente.id ? cliente : c)));
  }

  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  private mensajeError(error: unknown, porDefecto: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No hay conexión con el servidor.';
      if (typeof error.error?.message === 'string' && error.error.message) return error.error.message;
    }
    return porDefecto;
  }

  private toast(severity: 'success' | 'warn' | 'error', summary: string, detail: string, life = 4000): void {
    this.messageService.add({ severity, summary, detail, life });
  }
}
