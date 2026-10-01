import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, Venta, VentaRequest } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = 'http://localhost:8080';

	// Fechas yyyy-MM-dd
	listar(desde: string, hasta: string): Observable<Venta[]> {
		return this.http.get<Venta[]>(`${this.apiUrl}/ventas`, { params: { desde, hasta } });
	}

	// Ventas de la caja abierta (vacío si no hay caja)
	listarTurno(): Observable<Venta[]> {
		return this.http.get<Venta[]>(`${this.apiUrl}/ventas/turno`);
	}

	obtener(id: number): Observable<Venta> {
		return this.http.get<Venta>(`${this.apiUrl}/ventas/${id}`);
	}

	registrar(datos: VentaRequest): Observable<Venta> {
		return this.http.post<Venta>(`${this.apiUrl}/ventas`, datos);
	}

	anular(id: number): Observable<Venta> {
		return this.http.put<Venta>(`${this.apiUrl}/ventas/${id}/anular`, null);
	}

	productos(): Observable<Producto[]> {
		return this.http.get<Producto[]>(`${this.apiUrl}/productos`);
	}
}
