import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
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
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BotonCancelarComponent, BotonIconoComponent, BotonPrincipalComponent } from '../../components/botones';
import { EnlaceAccesoComponent } from '../../components/enlace-acceso/enlace-acceso';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { AccesoClienteEvento, EventosClientesService } from '../../services/eventos-clientes.service';
import { Cliente, ClienteDetalle, ClienteRequest, Entrenador, MembresiaCliente } from '../../models/cliente.model';
import { AccesoCliente, EstadoAcceso, TipoDocumento } from '../../models/acceso.model';
import {
  ESTADOS_ACCESO,
  TIPOS_DOCUMENTO,
  abreviaturaDocumento,
  documentoSegunTipo,
  maxLongitudDocumento,
  mensajeDocumento,
  nombreDocumento,
} from '../../utils/documento';
import { autocompletarDni } from '../../utils/autocompletar-dni';

type FiltroMembresia = 'todos' | 'con' | 'sin';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
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
    SkeletonModule,
    MessageModule,
    BotonCancelarComponent,
    BotonIconoComponent,
    BotonPrincipalComponent,
    EnlaceAccesoComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './clientes.html',
})
export class ClientesComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  // Registrar clientes y restablecer accesos: recepción y administración
  readonly puedeGestionarAccesos = this.authService.puedeGestionarAccesos();

  readonly clientes = signal<Cliente[]>([]);

  // Avisos en tiempo real del acceso de los clientes (SSE): null = esta pantalla no los recibe
  readonly enVivo = signal<'conectando' | 'conectado' | 'reconectando' | null>(null);
  // Reloj de la pantalla: un enlace pendiente pasa solo a "Enlace vencido" al llegar su vencimiento
  readonly ahora = signal(Date.now());
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
      return this.normalizar(`${this.nombreCompleto(c)} ${c.dni} ${c.correo ?? ''} ${c.celular ?? ''}`).includes(texto);
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
    tipoDocumento: ['DNI' as TipoDocumento, Validators.required],
    numeroDocumento: ['', [Validators.required, documentoSegunTipo()]],
    correo: ['', [Validators.email, Validators.maxLength(150)]],
    celular: ['', Validators.pattern(/^9\d{8}$/)],
    observaciones: ['', Validators.maxLength(255)],
  });
  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly tipoSeleccionado = signal<TipoDocumento>('DNI');
  // Solo al registrar: al editar no se consulta el padrón
  readonly dni = autocompletarDni(this.form, () => this.formVisible() && !this.editando());

  // Modal con el enlace de activación / restablecimiento
  readonly accesoVisible = signal(false);
  readonly acceso = signal<AccesoCliente | null>(null);
  readonly tituloAcceso = signal('Cliente registrado');
  readonly restableciendo = signal<number | null>(null);

  constructor() {
    this.form.controls.tipoDocumento.valueChanges.pipe(takeUntilDestroyed()).subscribe((tipo) => {
      this.tipoSeleccionado.set(tipo);
      this.form.controls.numeroDocumento.updateValueAndValidity();
    });

    const reloj = setInterval(() => this.ahora.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));

    // El backend solo envía los avisos a quien gestiona accesos (recepción y administración)
    if (this.puedeGestionarAccesos) {
      this.enVivo.set('conectando');
      inject(EventosClientesService)
        .escuchar()
        .pipe(takeUntilDestroyed())
        .subscribe((m) => {
          switch (m.tipo) {
            case 'conectado':
              this.enVivo.set('conectado');
              // Tras un corte pudo perderse algún aviso: se recarga la lista sin mostrar el esqueleto
              if (m.reconexion) void this.cargar(true);
              break;
            case 'desconectado':
              this.enVivo.set('reconectando');
              break;
            case 'sinPermiso':
              this.enVivo.set(null);
              break;
            case 'acceso':
              this.aplicarCambioAcceso(m.evento);
          }
        });
    }
  }

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

  // silencioso: recarga en segundo plano (tras un aviso en tiempo real), sin esqueleto ni mensaje de error
  async cargar(silencioso = false): Promise<void> {
    if (!silencioso) {
      this.loading.set(true);
      this.error.set(null);
    }
    try {
      this.clientes.set(await firstValueFrom(this.clienteService.listar()));
    } catch (e) {
      if (!silencioso) this.error.set(this.mensajeError(e, 'No se pudieron cargar los clientes.'));
    } finally {
      if (!silencioso) this.loading.set(false);
    }
  }

  // Aviso en tiempo real: actualiza la fila (y la ficha abierta) sin recargar la pantalla
  private aplicarCambioAcceso(e: AccesoClienteEvento): void {
    const actual = this.clientes().find((c) => c.id === e.idCliente);
    if (!e.clienteActivo) {
      this.clientes.update((lista) => lista.filter((c) => c.id !== e.idCliente));
      if (this.detalle()?.cliente.id === e.idCliente) this.detalleVisible.set(false);
      return;
    }
    if (!actual) {
      // Cliente nuevo o reactivado desde otra pantalla: se trae la lista completa
      void this.cargar(true);
      return;
    }
    const acceso = {
      tieneUsuario: e.tieneUsuario,
      estadoAcceso: e.estadoAcceso,
      enlaceVigente: e.enlaceVigente,
      enlaceExpiraEn: e.enlaceExpiraEn,
    };
    this.reemplazar({ ...actual, ...acceso });
    const abierto = this.detalle();
    if (abierto?.cliente.id === e.idCliente) {
      this.detalle.set({ ...abierto, cliente: { ...abierto.cliente, ...acceso } });
    }
    if (e.motivo === 'CUENTA_ACTIVADA') {
      this.toast('success', 'Cuenta activada', `${e.nombre} activó su cuenta y ya puede entrar a su portal.`, 6000);
    } else if (e.motivo === 'CONTRASENA_RESTABLECIDA') {
      this.toast('success', 'Contraseña restablecida', `${e.nombre} creó su nueva contraseña.`, 6000);
    }
  }

  // ---------- Registrar / editar ----------

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset();
    // Al registrar el celular es obligatorio: ahí se envía el enlace de activación
    this.celularObligatorio(true);
    this.formVisible.set(true);
  }

  abrirEditar(cliente: Cliente): void {
    this.editando.set(cliente);
    this.form.reset({
      nombre: cliente.nombre,
      apellidoPaterno: cliente.apellidoPaterno ?? '',
      apellidoMaterno: cliente.apellidoMaterno ?? '',
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.dni,
      correo: cliente.correo ?? '',
      celular: cliente.celular ?? '',
      observaciones: cliente.observaciones ?? '',
    });
    this.celularObligatorio(false);
    this.formVisible.set(true);
  }

  private celularObligatorio(obligatorio: boolean): void {
    const celular = this.form.controls.celular;
    celular.setValidators(obligatorio ? [Validators.required, Validators.pattern(/^9\d{8}$/)] : Validators.pattern(/^9\d{8}$/));
    celular.updateValueAndValidity();
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
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento.trim().toUpperCase(),
      correo: v.correo.trim() || null,
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
        // Sin duplicar: el aviso en tiempo real pudo traerlo antes que esta respuesta
        this.clientes.update((lista) => [r.cliente, ...lista.filter((c) => c.id !== r.cliente.id)]);
        if (r.acceso) {
          this.mostrarAcceso(r.acceso, 'Cliente registrado');
        } else {
          this.toast('success', 'Cliente registrado', r.mensaje, 7000);
        }
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

  // Desde el aviso "Este DNI ya está registrado" del formulario
  verClienteExistente(id: number): void {
    this.formVisible.set(false);
    this.verDetalle({ id });
  }

  async verDetalle(cliente: Pick<Cliente, 'id'>): Promise<void> {
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

  // ---------- Reenviar activación o restablecer contraseña (enlace por WhatsApp) ----------

  confirmarRestablecer(cliente: Cliente): void {
    const pendiente = cliente.estadoAcceso !== 'ACTIVO';
    this.confirmationService.confirm({
      header: this.accionAcceso(cliente),
      message: pendiente
        ? `Se generará un nuevo enlace de activación para ${this.nombreCompleto(cliente)}. Los enlaces anteriores dejarán de funcionar.`
        : `Se generará un enlace para que ${this.nombreCompleto(cliente)} cree una nueva contraseña. Los enlaces anteriores dejarán de funcionar y su cuenta se desbloqueará.`,
      icon: 'pi pi-key',
      acceptLabel: 'Generar enlace',
      rejectLabel: 'Cancelar',
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.restablecer(cliente),
    });
  }

  private async restablecer(cliente: Cliente): Promise<void> {
    this.restableciendo.set(cliente.id);
    try {
      const acceso = await firstValueFrom(this.clienteService.restablecerAcceso(cliente.id));
      // Si no tenía usuario, ahora queda pendiente de activación; en todos los casos tiene un enlace vigente
      this.reemplazar({
        ...cliente,
        tieneUsuario: true,
        estadoAcceso: cliente.tieneUsuario ? cliente.estadoAcceso : 'PENDIENTE_ACTIVACION',
        enlaceVigente: true,
        enlaceExpiraEn: acceso.expiraEn,
      });
      this.mostrarAcceso(acceso, acceso.tipo === 'ACTIVACION' ? 'Enlace de activación' : 'Restablecer contraseña');
    } catch (e) {
      this.toast('error', 'No se pudo generar el enlace', this.mensajeError(e, 'Inténtalo más tarde.'));
    } finally {
      this.restableciendo.set(null);
    }
  }

  private mostrarAcceso(acceso: AccesoCliente, titulo: string): void {
    this.tituloAcceso.set(titulo);
    this.acceso.set(acceso);
    this.accesoVisible.set(true);
  }

  // ---------- Eliminar (borrado lógico) ----------

  confirmarEliminacion(cliente: Cliente): void {
    this.confirmationService.confirm({
      header: 'Eliminar cliente',
      message: `${this.nombreCompleto(cliente)} dejará de aparecer en la lista de clientes. Su historial de membresías y ventas se conserva.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.eliminar(cliente),
    });
  }

  private async eliminar(cliente: Cliente): Promise<void> {
    try {
      await firstValueFrom(this.clienteService.eliminar(cliente.id));
      this.clientes.update((lista) => lista.filter((c) => c.id !== cliente.id));
      this.toast('success', 'Cliente eliminado', `${this.nombreCompleto(cliente)} se eliminó de la lista.`);
    } catch (e) {
      this.toast('error', 'No se pudo eliminar', this.mensajeError(e, 'Inténtalo de nuevo.'));
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

  // Pendiente sin un enlace vigente: recepción debe reenviarlo
  enlaceVencido(c: Cliente): boolean {
    if (c.estadoAcceso !== 'PENDIENTE_ACTIVACION') return false;
    return !c.enlaceExpiraEn || new Date(c.enlaceExpiraEn).getTime() <= this.ahora();
  }

  etiquetaAcceso(c: Cliente): string {
    if (this.enlaceVencido(c)) return 'Enlace vencido';
    return c.estadoAcceso ? ESTADOS_ACCESO[c.estadoAcceso].etiqueta : 'Sin usuario';
  }

  severidadAcceso(c: Cliente): 'warn' | 'success' | 'secondary' | 'danger' {
    if (this.enlaceVencido(c)) return 'danger';
    return c.estadoAcceso ? ESTADOS_ACCESO[c.estadoAcceso].severidad : 'secondary';
  }

  // La acción depende de la cuenta: quien ya activó restablece su contraseña; el resto recibe su enlace de activación
  accionAcceso(c: Cliente): string {
    return c.estadoAcceso === 'ACTIVO' ? 'Restablecer contraseña' : 'Reenviar enlace de activación';
  }

  readonly abreviaturaDocumento = abreviaturaDocumento;
  readonly nombreDocumento = nombreDocumento;
  readonly mensajeDocumento = mensajeDocumento;
  readonly maxLongitudDocumento = maxLongitudDocumento;

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
