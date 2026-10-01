import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
	Cliente,
	ClienteDetalle,
	ClienteRequest,
	Entrenador,
	RegistroClienteResponse,
} from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = 'http://localhost:8080';

	listar(): Observable<Cliente[]> {
		return this.http.get<Cliente[]>(`${this.apiUrl}/clientes`);
	}

	obtener(id: number): Observable<ClienteDetalle> {
		return this.http.get<ClienteDetalle>(`${this.apiUrl}/clientes/${id}`);
	}

	// 404 si no existe un cliente con ese correo
	buscarPorCorreo(correo: string): Observable<Cliente> {
		return this.http.get<Cliente>(`${this.apiUrl}/clientes/buscar`, { params: { correo } });
	}

	registrar(datos: ClienteRequest): Observable<RegistroClienteResponse> {
		return this.http.post<RegistroClienteResponse>(`${this.apiUrl}/clientes`, datos);
	}

	actualizar(id: number, datos: ClienteRequest): Observable<Cliente> {
		return this.http.put<Cliente>(`${this.apiUrl}/clientes/${id}`, datos);
	}

	// Borrado lógico: el cliente pasa a inactivo
	eliminar(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/clientes/${id}`);
	}

	reenviarClave(id: number): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/clientes/${id}/reenviar-clave`, null);
	}

	asignarEntrenador(id: number, idEntrenador: number | null): Observable<Cliente> {
		return this.http.put<Cliente>(`${this.apiUrl}/clientes/${id}/entrenador`, { idEntrenador });
	}

	listarEntrenadores(): Observable<Entrenador[]> {
		return this.http.get<Entrenador[]>(`${this.apiUrl}/entrenadores`);
	}
}
