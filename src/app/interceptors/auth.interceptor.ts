import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// En estas rutas un 401 es un error del formulario (credenciales, enlace), no una sesión vencida
const RUTAS_PUBLICAS = ['/auth/login', '/auth/activacion'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService);
	const router = inject(Router);
	const token = authService.getToken();

	if (!token || RUTAS_PUBLICAS.some((ruta) => req.url.includes(ruta))) {
		return next(req);
	}

	return next(
		req.clone({
			setHeaders: { Authorization: `Bearer ${token}` },
		}),
	).pipe(
		catchError((error: unknown) => {
			// 401 = sesión vencida o inválida (un 403 es falta de permiso y no cierra la sesión)
			if (error instanceof HttpErrorResponse && error.status === 401) {
				const eraCliente = authService.esCliente();
				authService.logout();
				void router.navigateByUrl(eraCliente ? '/acceso-cliente' : '/login');
			}
			return throwError(() => error);
		}),
	);
};
