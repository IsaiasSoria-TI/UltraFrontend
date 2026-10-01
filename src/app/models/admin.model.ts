export interface Categoria {
	id: number;
	nombre: string;
	// cantidad de productos en la categoría
	productos: number;
}

export interface ProductoRequest {
	idCategoria: number;
	nombre: string;
	precio: number;
	stock: number;
}

export interface PlanRequest {
	nombre: string;
	precio: number;
	duracionDias: number;
}

export interface ProveedorRequest {
	razonSocial: string;
	ruc: string | null;
	telefono: string | null;
}

export interface ImpuestoRequest {
	nombre: string;
	porcentaje: number;
}

export interface Rol {
	id: number;
	nombre: string;
	usuarios: number;
}

export interface Usuario {
	id: number;
	usuario: string;
	nombre: string;
	apellidoPaterno: string | null;
	apellidoMaterno: string | null;
	dni: string;
	correo: string;
	celular: string | null;
	idRol: number;
	rol: string;
	estado: boolean;
}

export interface UsuarioRequest {
	nombre: string;
	apellidoPaterno: string;
	apellidoMaterno: string | null;
	dni: string;
	correo: string;
	celular: string | null;
	usuario: string;
	idRol: number;
	// solo al crear
	contrasena: string | null;
}

export interface IngresoDia {
	fecha: string;
	ventas: number;
	membresias: number;
}

export interface Reporte {
	desde: string;
	hasta: string;
	totalVentas: number;
	cantidadVentas: number;
	totalMembresias: number;
	cantidadMembresias: number;
	ingresos: number;
	totalCompras: number;
	cantidadCompras: number;
	ventasAnuladas: number;
	membresiasCanceladas: number;
	porDia: IngresoDia[];
	porMetodo: { metodo: string; cantidad: number; total: number }[];
	productos: { producto: string; cantidad: number; total: number }[];
	planes: { plan: string; cantidad: number; total: number }[];
}
