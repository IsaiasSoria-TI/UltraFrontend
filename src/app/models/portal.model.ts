import { Entrenador, MembresiaCliente } from './cliente.model';
import { TipoDocumento } from './acceso.model';

// Control de peso (sin comentarios): fecha, peso y quién lo registró
export interface Control {
	id: number;
	fecha: string;
	peso: number;
	registradoPor: string | null;
}

export interface Plan {
	id: number;
	nombre: string;
	precio: number;
	duracionDias: number;
}

export interface PerfilCliente {
	nombre: string;
	apellidoPaterno: string | null;
	apellidoMaterno: string | null;
	tipoDocumento: TipoDocumento;
	numeroDocumento: string;
	correo: string | null;
	celular: string | null;
	fechaRegistro: string;
}

// GET /portal. membresia: la vigente o la última (null si nunca compró). controles: del más reciente al más antiguo
export interface PortalCliente {
	perfil: PerfilCliente;
	entrenador: Entrenador | null;
	membresia: MembresiaCliente | null;
	historialMembresias: MembresiaCliente[];
	planes: Plan[];
	controles: Control[];
}
