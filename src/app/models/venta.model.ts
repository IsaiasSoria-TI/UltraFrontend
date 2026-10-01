export type EstadoVenta = 'activa' | 'anulada';

export interface Producto {
	id: number;
	nombre: string;
	idCategoria: number;
	categoria: string;
	precio: number;
	stock: number;
}

export interface DetalleVenta {
	idProducto: number;
	producto: string;
	cantidad: number;
	precioUnitario: number;
	subtotal: number;
}

export interface Venta {
	id: number;
	fecha: string;
	idCliente: number | null;
	cliente: string | null;
	usuario: string;
	metodoPago: string;
	total: number;
	estado: EstadoVenta;
	// true: su caja ya se cerró y no se puede anular
	cajaCerrada: boolean;
	// null en el listado
	detalles: DetalleVenta[] | null;
}

export interface VentaRequest {
	idCliente: number | null;
	idMetodoPago: number;
	detalles: { idProducto: number; cantidad: number }[];
}
