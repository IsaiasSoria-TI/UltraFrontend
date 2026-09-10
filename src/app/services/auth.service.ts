import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/login.model';

const TOKEN_KEY = 'auth_token';

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
}
