export type EstadoMembresia = 'activo' | 'programado' | 'vencido' | 'cancelado';

export interface Entrenador {
	id: number;
	nombre: string;
}

export interface MembresiaCliente {
	id: number;
	plan: string;
	fechaInicio: string;
	fechaFin: string;
	montoPagado: number;
	estado: EstadoMembresia;
}

export interface Cliente {
	id: number;
	nombre: string;
	apellidoPaterno: string | null;
	apellidoMaterno: string | null;
	dni: string;
	correo: string;
	celular: string | null;
	observaciones: string | null;
	fechaRegistro: string;
	estado: boolean;
	tieneUsuario: boolean;
	entrenador: Entrenador | null;
	membresia: MembresiaCliente | null;
}

export interface ClienteDetalle {
	cliente: Cliente;
	historialMembresias: MembresiaCliente[];
}

export interface ClienteRequest {
	nombre: string;
	apellidoPaterno: string;
	apellidoMaterno: string | null;
	dni: string;
	correo: string;
	celular: string | null;
	observaciones: string | null;
}

export interface RegistroClienteResponse {
	cliente: Cliente;
	usuarioCreado: boolean;
	correoEnviado: boolean;
	mensaje: string;
}
