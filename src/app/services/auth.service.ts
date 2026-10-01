import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/login.model';

const TOKEN_KEY = 'auth_token';

interface TokenPayload {
	sub?: string;
	rol?: string;
	id_usuario?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = 'http://localhost:8080/auth';

	login(credentials: LoginRequest): Observable<LoginResponse> {
		return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
			tap((response) => {
				if (response.token) {
					localStorage.setItem(TOKEN_KEY, response.token);
				}
			}),
		);
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
