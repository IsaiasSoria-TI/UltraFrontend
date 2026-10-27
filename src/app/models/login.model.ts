import { TipoDocumento } from './acceso.model';

export interface LoginRequest {
	username: string;
	password: string;
}

// Login de clientes: tipo y número de documento
export interface LoginClienteRequest {
	tipoDocumento: TipoDocumento;
	numeroDocumento: string;
	password: string;
}

export interface LoginResponse {
	token?: string;
	message?: string;
	userId?: number;
	username?: string;
}
