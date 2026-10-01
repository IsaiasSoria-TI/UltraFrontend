import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rol, Usuario, UsuarioRequest } from '../models/admin.model';

// Personal del gimnasio (los usuarios de clientes se gestionan en Clientes)
@Injectable({ providedIn: 'root' })
export class UsuarioService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = 'http://localhost:8080';

	listar(): Observable<Usuario[]> {
		return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
	}

	roles(): Observable<Rol[]> {
		return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
	}

	crear(datos: UsuarioRequest): Observable<Usuario> {
		return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, datos);
	}

	actualizar(id: number, datos: UsuarioRequest): Observable<Usuario> {
		return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${id}`, datos);
	}

	cambiarEstado(id: number, estado: boolean): Observable<Usuario> {
		return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${id}/estado`, { estado });
	}

	restablecerContrasena(id: number, contrasena: string): Observable<void> {
		return this.http.put<void>(`${this.apiUrl}/usuarios/${id}/contrasena`, { contrasena });
	}
}
