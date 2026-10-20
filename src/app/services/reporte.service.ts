import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reporte } from '../models/admin.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = `${environment.apiUrl}/reportes`;

	// Fechas yyyy-MM-dd
	generar(desde: string, hasta: string): Observable<Reporte> {
		return this.http.get<Reporte>(this.apiUrl, { params: { desde, hasta } });
	}
}
