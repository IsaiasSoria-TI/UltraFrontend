import { Injectable, effect, signal } from '@angular/core';

const THEME_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
	readonly dark = signal(this.leerPreferencia());

	constructor() {
		// La clase .dark en <html> activa el modo oscuro de PrimeNG y de Tailwind
		effect(() => {
			const dark = this.dark();
			document.documentElement.classList.toggle('dark', dark);
			try {
				localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
			} catch {
				// sin almacenamiento disponible: el tema solo dura la sesión
			}
		});
	}

	toggle(): void {
		this.dark.update((d) => !d);
	}

	private leerPreferencia(): boolean {
		try {
			return localStorage.getItem(THEME_KEY) === 'dark';
		} catch {
			return false;
		}
	}
}
