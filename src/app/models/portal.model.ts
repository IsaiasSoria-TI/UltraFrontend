import { Entrenador, MembresiaCliente } from './cliente.model';
import { TipoDocumento } from './acceso.model';

// Perímetros de un control en cm (un decimal); un solo lado (el derecho) en bíceps, antebrazo, muslo y pantorrilla
export interface Perimetros {
	cuello: number | null;
	hombros: number | null;
	pecho: number | null;
	biceps: number | null;
	antebrazo: number | null;
	cintura: number | null;
	abdomen: number | null;
	cadera: number | null;
	muslo: number | null;
	pantorrilla: number | null;
}

// Control (sin comentarios): fecha, peso, perímetros (null si no se midió ninguno) y quién lo registró
export interface Control {
	id: number;
	fecha: string;
	peso: number;
	perimetros: Perimetros | null;
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
