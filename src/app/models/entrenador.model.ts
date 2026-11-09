import { TipoDocumento } from './acceso.model';
import { MembresiaCliente } from './cliente.model';
import { Control } from './portal.model';

// Cliente asignado al entrenador (la membresía llega sin monto)
export interface ClienteAsignado {
	id: number;
	nombre: string;
	apellidoPaterno: string | null;
	apellidoMaterno: string | null;
	tipoDocumento: TipoDocumento;
	numeroDocumento: string;
	membresia: MembresiaCliente | null;
	ultimoControl: string | null;
	pesoActual: number | null;
}

export interface DetalleClienteAsignado {
	cliente: ClienteAsignado;
	celular: string | null;
	correo: string | null;
	fechaRegistro: string;
	controles: Control[];
}

// Control en las listas del entrenador: indica de qué cliente es
export interface ControlRegistrado {
	id: number;
	fecha: string;
	peso: number;
	idCliente: number;
	cliente: string;
}

export interface ResumenEntrenador {
	nombre: string;
	clientesAsignados: number;
	controlesMes: number;
	membresiasPorVencer: number;
	totalPendientes: number;
	pendientes: ClienteAsignado[];
	ultimosControles: ControlRegistrado[];
}

// fecha en yyyy-MM-dd
export interface RegistrarControlRequest {
	fecha: string;
	peso: number;
}
