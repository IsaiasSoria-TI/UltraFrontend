import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Impuesto } from '../models/compra.model';
import { ImpuestoRequest } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class ImpuestoService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = 'http://localhost:8080/impuestos';

	// Incluye los inactivos
	listar(): Observable<Impuesto[]> {
		return this.http.get<Impuesto[]>(this.apiUrl);
	}

	crear(datos: ImpuestoRequest): Observable<Impuesto> {
		return this.http.post<Impuesto>(this.apiUrl, datos);
	}

	actualizar(id: number, datos: ImpuestoRequest): Observable<Impuesto> {
		return this.http.put<Impuesto>(`${this.apiUrl}/${id}`, datos);
	}

	cambiarEstado(id: number, estado: boolean): Observable<Impuesto> {
		return this.http.put<Impuesto>(`${this.apiUrl}/${id}/estado`, { estado });
	}
}
