import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { EstadoAcceso, TipoDocumento } from '../models/acceso.model';

export const TIPOS_DOCUMENTO: { label: string; value: TipoDocumento }[] = [
	{ label: 'DNI', value: 'DNI' },
	{ label: 'Carné de extranjería', value: 'CARNET_EXTRANJERIA' },
	{ label: 'Pasaporte', value: 'PASAPORTE' },
];

const ABREVIATURAS: Record<TipoDocumento, string> = { DNI: 'DNI', CARNET_EXTRANJERIA: 'CE', PASAPORTE: 'Pas.' };

export function abreviaturaDocumento(tipo: TipoDocumento | string | null | undefined): string {
	return ABREVIATURAS[tipo as TipoDocumento] ?? 'DNI';
}

export function nombreDocumento(tipo: TipoDocumento | null | undefined): string {
	return TIPOS_DOCUMENTO.find((t) => t.value === tipo)?.label ?? 'DNI';
}

// Mismas reglas que el backend: DNI 8 dígitos; carné y pasaporte 9 a 12 alfanuméricos
export function documentoValido(tipo: TipoDocumento, numero: string): boolean {
	return tipo === 'DNI' ? /^\d{8}$/.test(numero) : /^[A-Za-z0-9]{9,12}$/.test(numero);
}

export function mensajeDocumento(tipo: TipoDocumento): string {
	return tipo === 'DNI' ? 'El DNI debe tener 8 dígitos.' : 'Debe tener entre 9 y 12 letras o números.';
}

export function maxLongitudDocumento(tipo: TipoDocumento): number {
	return tipo === 'DNI' ? 8 : 12;
}

/**
 * Validador del número que lee el tipo del mismo grupo. Al cambiar el tipo hay que llamar
 * a updateValueAndValidity() del número.
 */
export function documentoSegunTipo(campoTipo = 'tipoDocumento'): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const tipo = control.parent?.get(campoTipo)?.value as TipoDocumento | undefined;
		const valor = String(control.value ?? '').trim();
		if (!valor || !tipo) return null;
		return documentoValido(tipo, valor) ? null : { documento: true };
	};
}

export const ESTADOS_ACCESO: Record<EstadoAcceso, { etiqueta: string; severidad: 'warn' | 'success' | 'secondary' }> = {
	PENDIENTE_ACTIVACION: { etiqueta: 'Pendiente de activación', severidad: 'warn' },
	ACTIVO: { etiqueta: 'Activo', severidad: 'success' },
	INACTIVO: { etiqueta: 'Inactivo', severidad: 'secondary' },
};
