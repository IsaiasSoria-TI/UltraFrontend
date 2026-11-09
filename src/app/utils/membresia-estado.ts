import { MembresiaCliente } from '../models/cliente.model';

// Estados que ve el cliente o el entrenador; "Por vencer" = activa que termina en 7 días o menos (igual que el backend)
export type EstadoVisual = 'Activa' | 'Por vencer' | 'Programada' | 'Vencida' | 'Cancelada';

export const DIAS_AVISO_VENCIMIENTO = 7;
const DIA_MS = 86_400_000;

export function diasRestantes(m: MembresiaCliente, ahora = new Date()): number {
	return Math.max(0, Math.ceil((new Date(m.fechaFin).getTime() - ahora.getTime()) / DIA_MS));
}

export function diasParaEmpezar(m: MembresiaCliente, ahora = new Date()): number {
	return Math.max(0, Math.ceil((new Date(m.fechaInicio).getTime() - ahora.getTime()) / DIA_MS));
}

export function diasDesdeQueVencio(m: MembresiaCliente, ahora = new Date()): number {
	return Math.max(0, Math.floor((ahora.getTime() - new Date(m.fechaFin).getTime()) / DIA_MS));
}

// Porcentaje del periodo ya transcurrido (0 a 100)
export function avancePeriodo(m: MembresiaCliente, ahora = new Date()): number {
	const inicio = new Date(m.fechaInicio).getTime();
	const fin = new Date(m.fechaFin).getTime();
	if (fin <= inicio) return 100;
	return Math.min(100, Math.max(0, ((ahora.getTime() - inicio) / (fin - inicio)) * 100));
}

export function estadoVisual(m: MembresiaCliente, ahora = new Date()): EstadoVisual {
	switch (m.estado) {
		case 'programado':
			return 'Programada';
		case 'vencido':
			return 'Vencida';
		case 'cancelado':
			return 'Cancelada';
		default:
			return diasRestantes(m, ahora) <= DIAS_AVISO_VENCIMIENTO ? 'Por vencer' : 'Activa';
	}
}

// Colores de la etiqueta de estado (mismos tokens que el diseño de Figma)
export const CLASES_ESTADO: Record<EstadoVisual, string> = {
	Activa: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
	'Por vencer': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
	Programada: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
	Vencida: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
	Cancelada: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export function nombreCompleto(p: { nombre: string; apellidoPaterno: string | null; apellidoMaterno?: string | null }): string {
	return [p.nombre, p.apellidoPaterno, p.apellidoMaterno].filter(Boolean).join(' ');
}

export function iniciales(p: { nombre: string; apellidoPaterno: string | null }): string {
	return (p.nombre.charAt(0) + (p.apellidoPaterno?.charAt(0) ?? '')).toUpperCase();
}
