export interface CajaResumen {
	id: number;
	usuario: string;
	fechaApertura: string;
	montoInicial: number;
}

export interface VentaDia {
	fecha: string;
	total: number;
	cantidad: number;
}

export interface MembresiaPorVencer {
	id: number;
	cliente: string;
	plan: string;
	fechaFin: string;
	diasRestantes: number;
}

export interface ProductoStockBajo {
	id: number;
	nombre: string;
	stock: number;
}

export interface UltimaVenta {
	id: number;
	cliente: string;
	usuario: string;
	fecha: string;
	total: number;
	estado: 'activa' | 'anulada';
}

export interface DashboardResumen {
	clientesActivos: number;
	membresiasActivas: number;
	membresiasProgramadas: number;
	ventasHoyTotal: number;
	ventasHoyCantidad: number;
	caja: CajaResumen | null;
	ventasUltimos7Dias: VentaDia[];
	membresiasPorVencer: MembresiaPorVencer[];
	productosStockBajo: ProductoStockBajo[];
	ultimasVentas: UltimaVenta[];
}
