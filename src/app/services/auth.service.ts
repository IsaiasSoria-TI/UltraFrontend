import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginClienteRequest, LoginRequest, LoginResponse } from '../models/login.model';
import { ActivacionRequest, CambiarContrasenaRequest, ValidacionToken } from '../models/acceso.model';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'auth_token';
// La contraseña es temporal: hasta cambiarla solo se puede usar /cambiar-contrasena (el backend también lo exige)
const CAMBIAR_CLAVE_KEY = 'cambiar_contrasena';

interface TokenPayload {
	sub?: string;
	rol?: string;
	id_usuario?: number;
	exp?: number; // vencimiento en segundos desde epoch
}

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = `${environment.apiUrl}/auth`;

	login(credentials: LoginRequest): Observable<LoginResponse> {
		return this.http
			.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
			.pipe(tap((response) => this.guardarSesion(response)));
	}

	/**
	 * Login de clientes por documento. La sesión solo sirve para el portal del cliente: el backend
	 * responde 403 a la gestión interna.
	 */
	loginCliente(credentials: LoginClienteRequest): Observable<LoginResponse> {
		return this.http
			.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
			.pipe(tap((response) => this.guardarSesion(response)));
	}

	// Página pública /activar
	validarActivacion(token: string): Observable<ValidacionToken> {
		return this.http.get<ValidacionToken>(`${this.apiUrl}/activacion/validar`, { params: { token } });
	}

	// Al activar la cuenta el backend inicia la sesión: el cliente entra directo a su portal
	activar(datos: ActivacionRequest): Observable<LoginResponse> {
		return this.http
			.post<LoginResponse>(`${this.apiUrl}/activacion`, datos)
			.pipe(tap((response) => this.guardarSesion(response)));
	}

	// Contraseña del usuario con sesión (clientes y personal)
	cambiarContrasena(datos: CambiarContrasenaRequest): Observable<void> {
		return this.http
			.post<void>(`${this.apiUrl}/contrasena`, datos)
			.pipe(tap(() => localStorage.removeItem(CAMBIAR_CLAVE_KEY)));
	}

	debeCambiarContrasena(): boolean {
		return this.isLoggedIn() && localStorage.getItem(CAMBIAR_CLAVE_KEY) === 'true';
	}

	logout(): void {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(CAMBIAR_CLAVE_KEY);
	}

	private guardarSesion(response: LoginResponse): void {
		if (!response.token) return;
		localStorage.setItem(TOKEN_KEY, response.token);
		if (response.cambiarContrasena) {
			localStorage.setItem(CAMBIAR_CLAVE_KEY, 'true');
		} else {
			localStorage.removeItem(CAMBIAR_CLAVE_KEY);
		}
	}

	getToken(): string | null {
		return localStorage.getItem(TOKEN_KEY);
	}

	// Hay token y no ha vencido; si venció se descarta para no dejar al usuario con una sesión muerta
	isLoggedIn(): boolean {
		if (!this.getToken()) return false;
		if (this.tokenVencido()) {
			this.logout();
			return false;
		}
		return true;
	}

	private tokenVencido(): boolean {
		const exp = this.getPayload()?.exp;
		// Un token ilegible o sin exp se deja pasar: el backend decide (responde 401 y el interceptor cierra la sesión)
		return typeof exp === 'number' && exp * 1000 <= Date.now();
	}

	getUsername(): string {
		return this.getPayload()?.sub ?? '';
	}

	getRol(): string {
		return this.getPayload()?.rol ?? '';
	}

	// Anular ventas y cancelar membresías (el backend vuelve a validarlo)
	esAdministrador(): boolean {
		const rol = this.rolNormalizado();
		return rol === 'ADMINISTRADOR' || rol === 'SOPORTE TECNICO';
	}

	// Registrar clientes y generar sus enlaces de acceso (el backend vuelve a validarlo)
	puedeGestionarAccesos(): boolean {
		return this.rolNormalizado() === 'RECEPCIONISTA' || this.esAdministrador();
	}

	esCliente(): boolean {
		return this.rolNormalizado() === 'CLIENTE';
	}

	esEntrenador(): boolean {
		return this.rolNormalizado() === 'ENTRENADOR';
	}

	// Pantalla de inicio según el rol: portal del cliente, portal del entrenador o el panel interno
	rutaInicio(): string {
		if (this.debeCambiarContrasena()) return '/cambiar-contrasena';
		if (this.esCliente()) return '/portal';
		if (this.esEntrenador()) return '/entrenador';
		return '/dashboard';
	}

	private rolNormalizado(): string {
		return this.getRol().normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
	}

	// Solo lee los claims para mostrarlos; la firma la valida el backend
	private getPayload(): TokenPayload | null {
		const token = this.getToken();
		if (!token) {
			return null;
		}
		try {
			const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
			const json = decodeURIComponent(
				atob(base64)
					.split('')
					.map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
					.join(''),
			);
			return JSON.parse(json) as TokenPayload;
		} catch {
			return null;
		}
	}
}
