import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Compra, CompraRequest, Impuesto, Proveedor } from '../models/compra.model';

@Injectable({ providedIn: 'root' })
export class CompraService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = 'http://localhost:8080';

	listar(): Observable<Compra[]> {
		return this.http.get<Compra[]>(`${this.apiUrl}/compras`);
	}

	obtener(id: number): Observable<Compra> {
		return this.http.get<Compra>(`${this.apiUrl}/compras/${id}`);
	}

	facturaRegistrada(idProveedor: number, codigoFactura: string): Observable<boolean> {
		return this.http
			.get<{ registrada: boolean }>(`${this.apiUrl}/compras/verificar-factura`, {
				params: { idProveedor, codigoFactura },
			})
			.pipe(map((r) => r.registrada));
	}

	registrar(datos: CompraRequest): Observable<Compra> {
		return this.http.post<Compra>(`${this.apiUrl}/compras`, datos);
	}

	proveedores(): Observable<Proveedor[]> {
		return this.http.get<Proveedor[]>(`${this.apiUrl}/proveedores`);
	}

	impuestos(): Observable<Impuesto[]> {
		return this.http.get<Impuesto[]>(`${this.apiUrl}/impuestos/activos`);
	}
}
