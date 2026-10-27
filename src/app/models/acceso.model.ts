export type TipoDocumento = 'DNI' | 'CARNET_EXTRANJERIA' | 'PASAPORTE';

export type EstadoAcceso = 'PENDIENTE_ACTIVACION' | 'ACTIVO' | 'INACTIVO';

export type TipoToken = 'ACTIVACION' | 'RESTABLECIMIENTO';

// Enlace recién generado: solo se muestra en el modal, nunca se guarda en el navegador
export interface AccesoCliente {
	nombre: string;
	celular: string | null;
	tipo: TipoToken;
	enlaceActivacion: string;
	whatsappUrl: string | null;
	expiraEn: string;
}

export interface ValidacionToken {
	valido: boolean;
	nombre: string | null;
	tipo: TipoToken | null;
	tipoDocumento: TipoDocumento | null;
	documentoOculto: string | null;
}

export interface ActivacionRequest {
	token: string;
	numeroDocumento: string;
	password: string;
	confirmacion: string;
}
