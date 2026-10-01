import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteMembresia, Cotizacion, Plan, VenderMembresiaRequest } from '../models/membresia.model';
import { PlanRequest } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class MembresiaService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = 'http://localhost:8080/membresias';

	listar(): Observable<ClienteMembresia[]> {
		return this.http.get<ClienteMembresia[]>(this.apiUrl);
	}

	// Membresías cobradas en la caja abierta (vacío si no hay caja)
	listarTurno(): Observable<ClienteMembresia[]> {
		return this.http.get<ClienteMembresia[]>(`${this.apiUrl}/turno`);
	}

	planes(): Observable<Plan[]> {
		return this.http.get<Plan[]>(`${this.apiUrl}/planes`);
	}

	// Gestión de planes (Administrador)
	crearPlan(datos: PlanRequest): Observable<Plan> {
		return this.http.post<Plan>(`${this.apiUrl}/planes`, datos);
	}

	actualizarPlan(id: number, datos: PlanRequest): Observable<Plan> {
		return this.http.put<Plan>(`${this.apiUrl}/planes/${id}`, datos);
	}

	eliminarPlan(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/planes/${id}`);
	}

	cotizar(idCliente: number, idMembresia: number): Observable<Cotizacion> {
		return this.http.post<Cotizacion>(`${this.apiUrl}/cotizar`, { idCliente, idMembresia });
	}

	vender(datos: VenderMembresiaRequest): Observable<ClienteMembresia> {
		return this.http.post<ClienteMembresia>(this.apiUrl, datos);
	}

	cancelar(id: number): Observable<ClienteMembresia> {
		return this.http.put<ClienteMembresia>(`${this.apiUrl}/${id}/cancelar`, null);
	}
}
