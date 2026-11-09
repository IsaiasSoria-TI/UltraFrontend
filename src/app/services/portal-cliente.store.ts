import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PortalCliente } from '../models/portal.model';
import { mensajeError } from '../utils/http-error';

/**
 * Datos del portal del cliente (GET /portal). Se provee en el layout del portal: todas sus
 * pantallas comparten una sola carga y se descarta al salir del portal.
 */
@Injectable()
export class PortalClienteStore {
	private readonly http = inject(HttpClient);

	readonly datos = signal<PortalCliente | null>(null);
	readonly cargando = signal(false);
	readonly error = signal<string | null>(null);

	readonly iniciales = computed(() => {
		const p = this.datos()?.perfil;
		if (!p) return '';
		return (p.nombre.charAt(0) + (p.apellidoPaterno?.charAt(0) ?? '')).toUpperCase();
	});

	async cargar(): Promise<void> {
		if (this.cargando()) return;
		this.cargando.set(true);
		this.error.set(null);
		try {
			this.datos.set(await firstValueFrom(this.http.get<PortalCliente>(`${environment.apiUrl}/portal`)));
		} catch (e) {
			this.error.set(mensajeError(e, 'No se pudo cargar tu información. Inténtalo de nuevo.'));
		} finally {
			this.cargando.set(false);
		}
	}
}
