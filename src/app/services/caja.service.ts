import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Caja, MetodoPago } from '../models/caja.model';

@Injectable({ providedIn: 'root' })
export class CajaService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = 'http://localhost:8080';

	// null cuando no hay caja abierta (el backend responde 204)
	actual(): Observable<Caja | null> {
		return this.http.get<Caja | null>(`${this.apiUrl}/caja/actual`);
	}

	abrir(montoInicial: number): Observable<Caja> {
		return this.http.post<Caja>(`${this.apiUrl}/caja/abrir`, { montoInicial });
	}

	cerrar(montoFinal: number): Observable<Caja> {
		return this.http.post<Caja>(`${this.apiUrl}/caja/cerrar`, { montoFinal });
	}

	historial(): Observable<Caja[]> {
		return this.http.get<Caja[]>(`${this.apiUrl}/caja/historial`);
	}

	metodosPago(): Observable<MetodoPago[]> {
		return this.http.get<MetodoPago[]>(`${this.apiUrl}/metodos-pago`);
	}
}
