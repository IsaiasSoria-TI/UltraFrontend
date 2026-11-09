import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { EstadoAcceso } from '../models/acceso.model';

export type MotivoAcceso =
	| 'CLIENTE_REGISTRADO'
	| 'ENLACE_GENERADO'
	| 'CUENTA_ACTIVADA'
	| 'CONTRASENA_RESTABLECIDA'
	| 'CLIENTE_ELIMINADO';

// Estado de la cuenta de un cliente después del cambio (evento SSE "acceso")
export interface AccesoClienteEvento {
	idCliente: number;
	nombre: string;
	// false si el cliente fue eliminado
	clienteActivo: boolean;
	tieneUsuario: boolean;
	estadoAcceso: EstadoAcceso | null;
	enlaceVigente: boolean;
	enlaceExpiraEn: string | null;
	motivo: MotivoAcceso;
}

export type MensajeEventos =
	// reconexion = true si ya había estado conectado: hay que recargar por si se perdió algún aviso
	| { tipo: 'conectado'; reconexion: boolean }
	| { tipo: 'desconectado' }
	| { tipo: 'sinPermiso' }
	| { tipo: 'acceso'; evento: AccesoClienteEvento };

// Esperas entre reintentos: cada corte espera un poco más, hasta 30 s
const ESPERAS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

/**
 * Avisos en tiempo real de GET /clientes/eventos (Server-Sent Events). Se lee con fetch y no con
 * EventSource porque EventSource no puede enviar el header Authorization, y el JWT no debe ir en la URL.
 * Se reconecta solo; al cancelar la suscripción cierra la conexión.
 */
@Injectable({ providedIn: 'root' })
export class EventosClientesService {
	private readonly auth = inject(AuthService);
	private readonly url = `${environment.apiUrl}/clientes/eventos`;

	escuchar(): Observable<MensajeEventos> {
		return new Observable<MensajeEventos>((suscriptor) => {
			let cerrado = false;
			let conexion: AbortController | null = null;
			let temporizador: ReturnType<typeof setTimeout> | undefined;
			let intento = 0;
			let huboConexion = false;

			const procesar = (bloque: string): void => {
				let nombre = 'message';
				const datos: string[] = [];
				for (const linea of bloque.split(/\r?\n/)) {
					// Las líneas que empiezan con ":" son comentarios (el latido del servidor)
					if (!linea || linea.startsWith(':')) continue;
					const separador = linea.indexOf(':');
					const campo = separador < 0 ? linea : linea.slice(0, separador);
					const valor = separador < 0 ? '' : linea.slice(separador + 1).replace(/^ /, '');
					if (campo === 'event') nombre = valor;
					else if (campo === 'data') datos.push(valor);
				}
				if (nombre === 'conectado') {
					suscriptor.next({ tipo: 'conectado', reconexion: huboConexion });
					huboConexion = true;
					intento = 0;
				} else if (nombre === 'acceso' && datos.length) {
					try {
						suscriptor.next({ tipo: 'acceso', evento: JSON.parse(datos.join('\n')) as AccesoClienteEvento });
					} catch {
						// Un aviso mal formado no corta la conexión
					}
				}
			};

			const conectar = async (): Promise<void> => {
				conexion = new AbortController();
				try {
					const respuesta = await fetch(this.url, {
						headers: { Authorization: `Bearer ${this.auth.getToken() ?? ''}`, Accept: 'text/event-stream' },
						cache: 'no-store',
						signal: conexion.signal,
					});
					if (respuesta.status === 401 || respuesta.status === 403) {
						// Sin permiso o sesión vencida: reintentar no sirve
						suscriptor.next({ tipo: 'sinPermiso' });
						return;
					}
					if (!respuesta.ok || !respuesta.body) throw new Error(`HTTP ${respuesta.status}`);

					const lector = respuesta.body.pipeThrough(new TextDecoderStream()).getReader();
					let pendiente = '';
					for (;;) {
						const { value, done } = await lector.read();
						if (done) break;
						pendiente += value;
						// Cada evento SSE termina con una línea en blanco
						let fin = pendiente.search(/\r?\n\r?\n/);
						while (fin >= 0) {
							procesar(pendiente.slice(0, fin));
							pendiente = pendiente.slice(fin).replace(/^\r?\n\r?\n/, '');
							fin = pendiente.search(/\r?\n\r?\n/);
						}
					}
				} catch {
					// Corte de red o servidor caído: se reintenta abajo
				}
				if (cerrado) return;
				suscriptor.next({ tipo: 'desconectado' });
				const espera = ESPERAS_MS[Math.min(intento, ESPERAS_MS.length - 1)];
				intento++;
				temporizador = setTimeout(() => void conectar(), espera);
			};

			void conectar();
			return () => {
				cerrado = true;
				conexion?.abort();
				clearTimeout(temporizador);
			};
		});
	}
}
