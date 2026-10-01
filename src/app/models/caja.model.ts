export interface MetodoPago {
	id: number;
	nombre: string;
	afectaCaja: boolean;
}

export interface TotalMetodo {
	metodo: string;
	afectaCaja: boolean;
	cantidad: number;
	total: number;
}

export interface ResumenTurno {
	cantidadVentas: number;
	totalVentas: number;
	cantidadMembresias: number;
	totalMembresias: number;
	ingresosEfectivo: number;
	// Compras a proveedores pagadas con el dinero de la caja
	cantidadCompras: number;
	egresosCompras: number;
	porMetodo: TotalMetodo[];
}

export interface Caja {
	id: number;
	usuario: string;
	fechaApertura: string;
	fechaCierre: string | null;
	montoInicial: number;
	montoEsperado: number | null;
	montoFinal: number | null;
	// final - esperado: negativo = falta dinero
	diferencia: number | null;
	// null en el historial
	resumen: ResumenTurno | null;
}
