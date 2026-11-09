import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { EntrenadorService } from '../../../services/entrenador.service';
import { ClienteAsignado } from '../../../models/entrenador.model';
import { CargaComponent } from '../../../components/carga/carga';
import { FilaClienteComponent } from '../../../components/fila-cliente/fila-cliente';
import { EstadoMembresiaComponent } from '../../../components/estado-membresia/estado-membresia';
import { EstadoVisual, estadoVisual, iniciales, nombreCompleto } from '../../../utils/membresia-estado';
import { abreviaturaDocumento } from '../../../utils/documento';
import { mensajeError } from '../../../utils/http-error';
import { detalleCliente } from '../detalle-cliente';

type Filtro = 'todos' | 'activos' | 'porVencer' | 'inactivos';

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activos', etiqueta: 'Activos' },
  { valor: 'porVencer', etiqueta: 'Por vencer' },
  { valor: 'inactivos', etiqueta: 'Inactivos' },
];

function cumple(c: ClienteAsignado, filtro: Filtro): boolean {
  const e: EstadoVisual | null = c.membresia ? estadoVisual(c.membresia) : null;
  switch (filtro) {
    case 'activos':
      return e === 'Activa' || e === 'Por vencer' || e === 'Programada';
    case 'porVencer':
      return e === 'Por vencer';
    case 'inactivos':
      return e === null || e === 'Vencida' || e === 'Cancelada';
    default:
      return true;
  }
}

// Sin tildes ni mayúsculas, para buscar "jose" y encontrar "José"
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

@Component({
  selector: 'app-entrenador-clientes',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    CargaComponent,
    FilaClienteComponent,
    EstadoMembresiaComponent,
  ],
  templateUrl: './clientes.html',
})
export class EntrenadorClientesComponent {
  private readonly service = inject(EntrenadorService);

  protected readonly clientes = signal<ClienteAsignado[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtro = signal<Filtro>('todos');

  protected readonly filtros = FILTROS;
  protected readonly detalleCliente = detalleCliente;
  protected readonly nombreCompleto = nombreCompleto;
  protected readonly iniciales = iniciales;
  protected readonly abreviaturaDocumento = abreviaturaDocumento;
  protected readonly estadoVisual = estadoVisual;

  protected readonly cantidades = computed(() => {
    const lista = this.clientes() ?? [];
    return Object.fromEntries(FILTROS.map((f) => [f.valor, lista.filter((c) => cumple(c, f.valor)).length])) as Record<Filtro, number>;
  });

  protected readonly visibles = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    return (this.clientes() ?? []).filter(
      (c) =>
        cumple(c, this.filtro()) &&
        (!texto || normalizar(`${nombreCompleto(c)} ${c.numeroDocumento}`).includes(texto)),
    );
  });

  constructor() {
    // El indicador "Membresías por vencer" del inicio abre la lista ya filtrada
    const filtro = inject(ActivatedRoute).snapshot.queryParamMap.get('filtro');
    if (FILTROS.some((f) => f.valor === filtro)) this.filtro.set(filtro as Filtro);
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.error.set(null);
    try {
      this.clientes.set(await firstValueFrom(this.service.clientes()));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo cargar tus clientes. Inténtalo de nuevo.'));
    }
  }
}
