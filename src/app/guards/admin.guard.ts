import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Pantallas de Administración: el resto del personal vuelve al dashboard (el backend también lo valida)
export const adminGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	return authService.esAdministrador() ? true : inject(Router).parseUrl('/dashboard');
};
