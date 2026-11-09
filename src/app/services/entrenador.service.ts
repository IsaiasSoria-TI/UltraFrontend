import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
	ClienteAsignado,
	ControlRegistrado,
	DetalleClienteAsignado,
	RegistrarControlRequest,
	ResumenEntrenador,
} from '../models/entrenador.model';
import { Control } from '../models/portal.model';

// Portal del entrenador: solo sus clientes asignados (el backend lo valida)
@Injectable({ providedIn: 'root' })
export class EntrenadorService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = `${environment.apiUrl}/entrenador`;

	resumen(): Observable<ResumenEntrenador> {
		return this.http.get<ResumenEntrenador>(`${this.apiUrl}/resumen`);
	}

	clientes(): Observable<ClienteAsignado[]> {
		return this.http.get<ClienteAsignado[]>(`${this.apiUrl}/clientes`);
	}

	detalle(idCliente: number): Observable<DetalleClienteAsignado> {
		return this.http.get<DetalleClienteAsignado>(`${this.apiUrl}/clientes/${idCliente}`);
	}

	registrarControl(idCliente: number, datos: RegistrarControlRequest): Observable<Control> {
		return this.http.post<Control>(`${this.apiUrl}/clientes/${idCliente}/controles`, datos);
	}

	controles(): Observable<ControlRegistrado[]> {
		return this.http.get<ControlRegistrado[]>(`${this.apiUrl}/controles`);
	}
}
