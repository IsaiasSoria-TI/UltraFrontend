import { HttpErrorResponse } from '@angular/common/http';

// Mensaje del backend ({ message }) o uno por defecto
export function mensajeError(error: unknown, porDefecto: string): string {
	if (error instanceof HttpErrorResponse) {
		if (error.status === 0) return 'No hay conexión con el servidor.';
		if (typeof error.error?.message === 'string' && error.error.message) return error.error.message;
	}
	return porDefecto;
}

export function esNoEncontrado(error: unknown): boolean {
	return error instanceof HttpErrorResponse && error.status === 404;
}

// yyyy-MM-dd en hora local
export function fechaIso(fecha: Date): string {
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	const dia = String(fecha.getDate()).padStart(2, '0');
	return `${fecha.getFullYear()}-${mes}-${dia}`;
}
