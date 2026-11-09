import { ClienteAsignado } from '../../models/entrenador.model';

const DIA_MS = 86_400_000;

// Texto secundario de un cliente en las listas: plan y último control
export function detalleCliente(c: ClienteAsignado, ahora = new Date()): string {
	const plan = c.membresia?.plan ?? 'Sin membresía';
	return `${plan} · ${textoUltimoControl(c, ahora)}`;
}

export function textoUltimoControl(c: ClienteAsignado, ahora = new Date()): string {
	if (!c.ultimoControl) return 'Sin controles registrados';
	const dias = Math.floor((ahora.getTime() - new Date(c.ultimoControl).getTime()) / DIA_MS);
	if (dias <= 0) return 'Último control hoy';
	if (dias === 1) return 'Último control ayer';
	return `Último control hace ${dias} días`;
}
