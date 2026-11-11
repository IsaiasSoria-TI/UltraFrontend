// Modo de la interfaz: preferencia de cada usuario
export type Tema = 'CLARO' | 'OSCURO';

/**
 * GET /perfil. El nombre y el color base (#rrggbb) son del gimnasio y los define el administrador.
 * fotoActualizadaEn es null si el usuario no tiene foto.
 */
export interface Perfil {
	tema: Tema;
	nombreGimnasio: string;
	colorGimnasio: string;
	fotoActualizadaEn: string | null;
}

// PUT /perfil/gimnasio (solo administrador)
export interface GimnasioRequest {
	nombre: string;
	colorBase: string;
}
