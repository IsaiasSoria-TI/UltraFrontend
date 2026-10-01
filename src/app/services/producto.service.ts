import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/venta.model';
import { Categoria, ProductoRequest } from '../models/admin.model';

// Gestión de productos y categorías (Administrador)
@Injectable({ providedIn: 'root' })
export class ProductoService {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = 'http://localhost:8080';

	listar(): Observable<Producto[]> {
		return this.http.get<Producto[]>(`${this.apiUrl}/productos`);
	}

	crear(datos: ProductoRequest): Observable<Producto> {
		return this.http.post<Producto>(`${this.apiUrl}/productos`, datos);
	}

	actualizar(id: number, datos: ProductoRequest): Observable<Producto> {
		return this.http.put<Producto>(`${this.apiUrl}/productos/${id}`, datos);
	}

	eliminar(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/productos/${id}`);
	}

	categorias(): Observable<Categoria[]> {
		return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`);
	}

	crearCategoria(nombre: string): Observable<Categoria> {
		return this.http.post<Categoria>(`${this.apiUrl}/categorias`, { nombre });
	}

	actualizarCategoria(id: number, nombre: string): Observable<Categoria> {
		return this.http.put<Categoria>(`${this.apiUrl}/categorias/${id}`, { nombre });
	}

	eliminarCategoria(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/categorias/${id}`);
	}
}
