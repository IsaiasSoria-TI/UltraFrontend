import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Portal del cliente: sin sesión va al login de clientes; otro rol, a su propia pantalla de inicio
export const clienteGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);
	if (!auth.isLoggedIn()) return router.parseUrl('/acceso-cliente');
	return auth.esCliente() ? true : router.parseUrl(auth.rutaInicio());
};

// Portal del entrenador
export const entrenadorGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);
	if (!auth.isLoggedIn()) return router.parseUrl('/login');
	return auth.esEntrenador() ? true : router.parseUrl(auth.rutaInicio());
};

// Panel interno: los clientes no entran (el backend también responde 403)
export const personalGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	return auth.esCliente() ? inject(Router).parseUrl('/portal') : true;
};

// Con contraseña temporal no se entra a ninguna pantalla hasta cambiarla
export const contrasenaGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	return auth.debeCambiarContrasena() ? inject(Router).parseUrl('/cambiar-contrasena') : true;
};

// /cambiar-contrasena: requiere sesión (cliente o personal)
export const sesionGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	return auth.isLoggedIn() ? true : inject(Router).parseUrl('/login');
};
