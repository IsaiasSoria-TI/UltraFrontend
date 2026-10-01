export interface Proveedor {
	id: number;
	razonSocial: string;
	ruc: string | null;
	telefono: string | null;
}

export interface Impuesto {
	id: number;
	nombre: string;
	porcentaje: number;
	estado: boolean;
}

export interface DetalleCompra {
	idProducto: number;
	producto: string;
	cantidad: number;
	precioUnitario: number;
	subtotal: number;
	impuesto: string;
	porcentajeImpuesto: number;
	montoImpuesto: number;
}

export interface Compra {
	id: number;
	idProveedor: number;
	proveedor: string;
	ruc: string | null;
	codigoFactura: string;
	fechaCompra: string;
	subtotal: number;
	impuesto: number;
	total: number;
	estado: string;
	// true: se pagó con el dinero de la caja
	pagoConCaja: boolean;
	// null en el listado
	detalles: DetalleCompra[] | null;
}

export interface CompraRequest {
	idProveedor: number;
	codigoFactura: string;
	// yyyy-MM-dd
	fechaCompra: string;
	detalles: { idProducto: number; cantidad: number; precioUnitario: number; idImpuesto: number }[];
	pagoConCaja: boolean;
}
