import { AccesoCliente, EstadoAcceso, TipoDocumento } from './acceso.model';

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
	tipoDocumento: TipoDocumento;
	// Número del documento (el backend conserva el nombre "dni")
	dni: string;
	correo: string | null;
	celular: string | null;
	observaciones: string | null;
	fechaRegistro: string;
	estado: boolean;
	tieneUsuario: boolean;
	// null si no tiene usuario
	estadoAcceso: EstadoAcceso | null;
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
	tipoDocumento: TipoDocumento;
	numeroDocumento: string;
	correo: string | null;
	celular: string | null;
	observaciones: string | null;
}

// acceso = null cuando la persona ya tenía usuario
export interface RegistroClienteResponse {
	cliente: Cliente;
	usuarioCreado: boolean;
	acceso: AccesoCliente | null;
	mensaje: string;
}

// Autocompletado con el DNI (GET /consultas/dni/{dni})
export interface DatosDni {
	dni: string;
	nombres: string | null;
	apellidoPaterno: string | null;
	apellidoMaterno: string | null;
}
