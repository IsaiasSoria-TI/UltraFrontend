import { EstadoMembresia } from './cliente.model';

export interface Plan {
	id: number;
	nombre: string;
	precio: number;
	duracionDias: number;
}

export interface Cotizacion {
	idCliente: number;
	cliente: string;
	idMembresia: number;
	plan: string;
	duracionDias: number;
	monto: number;
	fechaInicio: string;
	fechaFin: string;
	estado: EstadoMembresia;
	// true si continúa una membresía vigente
	renovacion: boolean;
}

export interface ClienteMembresia {
	id: number;
	idCliente: number;
	cliente: string;
	dni: string;
	correo: string;
	plan: string;
	fechaInicio: string;
	fechaFin: string;
	montoPagado: number;
	metodoPago: string;
	usuario: string;
	estado: EstadoMembresia;
	// true: se cobró en una caja ya cerrada y no se puede cancelar
	cajaCerrada: boolean;
}

export interface VenderMembresiaRequest {
	idCliente: number;
	idMembresia: number;
	idMetodoPago: number;
}
