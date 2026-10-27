import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginClienteRequest, LoginRequest, LoginResponse } from '../models/login.model';
import { ActivacionRequest, ValidacionToken } from '../models/acceso.model';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'auth_token';

interface TokenPayload {
	sub?: string;
	rol?: string;
	id_usuario?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = `${environment.apiUrl}/auth`;

	login(credentials: LoginRequest): Observable<LoginResponse> {
		return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
			tap((response) => {
				if (response.token) {
					localStorage.setItem(TOKEN_KEY, response.token);
				}
			}),
		);
	}

	/**
	 * Login de clientes por documento. El token no se guarda como sesión del panel: los clientes
	 * no tienen acceso a la gestión (el backend responde 403 a todo) y aún no existe un portal de clientes.
	 */
	loginCliente(credentials: LoginClienteRequest): Observable<LoginResponse> {
		return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
	}

	// Página pública /activar
	validarActivacion(token: string): Observable<ValidacionToken> {
		return this.http.get<ValidacionToken>(`${this.apiUrl}/activacion/validar`, { params: { token } });
	}

	activar(datos: ActivacionRequest): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/activacion`, datos);
	}

	logout(): void {
		localStorage.removeItem(TOKEN_KEY);
	}

	getToken(): string | null {
		return localStorage.getItem(TOKEN_KEY);
	}

	isLoggedIn(): boolean {
		return !!this.getToken();
	}

	getUsername(): string {
		return this.getPayload()?.sub ?? '';
	}

	getRol(): string {
		return this.getPayload()?.rol ?? '';
	}

	// Anular ventas y cancelar membresías (el backend vuelve a validarlo)
	esAdministrador(): boolean {
		const rol = this.getRol().normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
		return rol === 'ADMINISTRADOR' || rol === 'SOPORTE TECNICO';
	}

	// Registrar clientes y generar sus enlaces de acceso (el backend vuelve a validarlo)
	puedeGestionarAccesos(): boolean {
		const rol = this.getRol().normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
		return rol === 'RECEPCIONISTA' || this.esAdministrador();
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
