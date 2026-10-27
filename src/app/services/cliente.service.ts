import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AccesoCliente } from '../models/acceso.model';
import {
	Cliente,
	ClienteDetalle,
	ClienteRequest,
	DatosDni,
	Entrenador,
	RegistroClienteResponse,
} from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = environment.apiUrl;

	listar(): Observable<Cliente[]> {
		return this.http.get<Cliente[]>(`${this.apiUrl}/clientes`);
	}

	obtener(id: number): Observable<ClienteDetalle> {
		return this.http.get<ClienteDetalle>(`${this.apiUrl}/clientes/${id}`);
	}

	// 404 si no existe. Con "@" busca por correo; si no, por número de documento
	buscar(texto: string): Observable<Cliente> {
		const params: Record<string, string> = texto.includes('@') ? { correo: texto } : { documento: texto };
		return this.http.get<Cliente>(`${this.apiUrl}/clientes/buscar`, { params });
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

	// Nuevo enlace de activación / restablecimiento (invalida los anteriores y desbloquea la cuenta)
	restablecerAcceso(id: number): Observable<AccesoCliente> {
		return this.http.post<AccesoCliente>(`${this.apiUrl}/clientes/${id}/restablecer-acceso`, null);
	}

	asignarEntrenador(id: number, idEntrenador: number | null): Observable<Cliente> {
		return this.http.put<Cliente>(`${this.apiUrl}/clientes/${id}/entrenador`, { idEntrenador });
	}

	// Nombres y apellidos desde el padrón (apiperu.dev). 409 = ya es cliente; 404/429/503 = llenar a mano
	consultarDni(dni: string): Observable<DatosDni> {
		return this.http.get<DatosDni>(`${this.apiUrl}/consultas/dni/${dni}`);
	}

	listarEntrenadores(): Observable<Entrenador[]> {
		return this.http.get<Entrenador[]>(`${this.apiUrl}/entrenadores`);
	}
}
