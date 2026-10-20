import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../models/compra.model';
import { ProveedorRequest } from '../models/admin.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = `${environment.apiUrl}/proveedores`;

	listar(): Observable<Proveedor[]> {
		return this.http.get<Proveedor[]>(this.apiUrl);
	}

	crear(datos: ProveedorRequest): Observable<Proveedor> {
		return this.http.post<Proveedor>(this.apiUrl, datos);
	}

	actualizar(id: number, datos: ProveedorRequest): Observable<Proveedor> {
		return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, datos);
	}

	eliminar(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}
}
