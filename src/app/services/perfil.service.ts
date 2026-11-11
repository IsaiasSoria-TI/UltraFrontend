import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { GimnasioRequest, Perfil } from '../models/perfil.model';
import { COLOR_POR_DEFECTO, esHexValido, fondoMarca, paleta, textoSobre } from '../utils/marca';
import { prepararFotoPerfil } from '../utils/foto-perfil';
import { AuthService } from './auth.service';
import { ThemeService } from './theme.service';

// Último nombre y color conocidos del gimnasio: evitan que el menú parpadee mientras carga el perfil
const COLOR_KEY = 'color_gimnasio';
const NOMBRE_KEY = 'nombre_gimnasio';

/**
 * Personalización del usuario con sesión: su modo claro/nocturno (propio), la marca de su gimnasio
 * (nombre y color base; los cambia solo el administrador) y su foto de perfil. Todo se guarda en el
 * backend, así cada usuario lo encuentra igual en cualquier dispositivo.
 *
 * El color se publica como variables CSS en <html>: --marca-fondo y --marca-texto (menú y cabeceras,
 * con texto blanco u oscuro según el contraste) y --marca-50 … --marca-950 (paleta del color base).
 */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly apiUrl = `${environment.apiUrl}/perfil`;

  readonly colorGimnasio = signal<string>(leer(COLOR_KEY, esHexValido) ?? COLOR_POR_DEFECTO);
  readonly nombreGimnasio = signal<string>(leer(NOMBRE_KEY, (v): v is string => typeof v === 'string' && v.length > 0) ?? '');
  // URL local (blob:) de la foto; null si no tiene
  readonly foto = signal<string | null>(null);

  // Usuario cuyo perfil está cargado: al cambiar de sesión se vuelve a pedir
  private usuarioCargado: string | null = null;

  constructor() {
    effect(() => aplicarVariables(this.colorGimnasio(), this.theme.dark()));
  }

  asegurarCargado(): void {
    const usuario = this.auth.getUsername();
    if (!usuario || usuario === this.usuarioCargado) return;
    this.usuarioCargado = usuario;
    this.ponerFoto(null);
    void this.cargar(usuario);
  }

  private async cargar(usuario: string): Promise<void> {
    try {
      const perfil = await firstValueFrom(this.http.get<Perfil>(this.apiUrl));
      if (usuario !== this.usuarioCargado) return;
      this.theme.dark.set(perfil.tema === 'OSCURO');
      this.aplicarGimnasio(perfil);
      if (perfil.fotoActualizadaEn) {
        const foto = await firstValueFrom(this.http.get(`${this.apiUrl}/foto`, { responseType: 'blob' }));
        if (usuario === this.usuarioCargado) this.ponerFoto(foto);
      }
    } catch {
      // Sin perfil se usan los valores locales; se reintenta en la próxima pantalla que lo pida
      if (usuario === this.usuarioCargado) this.usuarioCargado = null;
    }
  }

  // El cambio se ve al instante; si no se puede guardar, solo dura en este navegador
  alternarTema(): void {
    const oscuro = !this.theme.dark();
    this.theme.dark.set(oscuro);
    this.http.put<Perfil>(`${this.apiUrl}/preferencias`, { tema: oscuro ? 'OSCURO' : 'CLARO' }).subscribe({ error: () => {} });
  }

  async cambiarTema(oscuro: boolean): Promise<void> {
    if (this.theme.dark() === oscuro) return;
    const anterior = this.theme.dark();
    this.theme.dark.set(oscuro);
    try {
      await firstValueFrom(this.http.put<Perfil>(`${this.apiUrl}/preferencias`, { tema: oscuro ? 'OSCURO' : 'CLARO' }));
    } catch (e) {
      this.theme.dark.set(anterior);
      throw e;
    }
  }

  // Solo administradores (el backend responde 403 al resto)
  async actualizarGimnasio(datos: GimnasioRequest): Promise<void> {
    this.aplicarGimnasio(await firstValueFrom(this.http.put<Perfil>(`${this.apiUrl}/gimnasio`, datos)));
  }

  // Lanza ErrorFoto si el archivo no sirve (tipo, peso o tamaño) antes de subir nada
  async subirFoto(archivo: File): Promise<void> {
    const foto = await prepararFotoPerfil(archivo);
    const datos = new FormData();
    datos.append('foto', foto, foto.type === 'image/webp' ? 'foto.webp' : 'foto.jpg');
    await firstValueFrom(this.http.put<Perfil>(`${this.apiUrl}/foto`, datos));
    this.ponerFoto(foto);
  }

  async quitarFoto(): Promise<void> {
    await firstValueFrom(this.http.delete<Perfil>(`${this.apiUrl}/foto`));
    this.ponerFoto(null);
  }

  private aplicarGimnasio(perfil: Perfil): void {
    if (esHexValido(perfil.colorGimnasio)) this.colorGimnasio.set(perfil.colorGimnasio.toLowerCase());
    this.nombreGimnasio.set(perfil.nombreGimnasio);
    guardar(COLOR_KEY, this.colorGimnasio());
    guardar(NOMBRE_KEY, perfil.nombreGimnasio);
  }

  private ponerFoto(foto: Blob | null): void {
    const anterior = this.foto();
    if (anterior) URL.revokeObjectURL(anterior);
    this.foto.set(foto ? URL.createObjectURL(foto) : null);
  }
}

function aplicarVariables(base: string, oscuro: boolean): void {
  const raiz = document.documentElement.style;
  const fondo = fondoMarca(base, oscuro);
  raiz.setProperty('--marca-fondo', fondo);
  raiz.setProperty('--marca-texto', textoSobre(fondo));
  for (const [tono, color] of Object.entries(paleta(base))) raiz.setProperty(`--marca-${tono}`, color);
}

function leer<T>(clave: string, valido: (v: unknown) => v is T): T | null {
  try {
    const valor = localStorage.getItem(clave);
    return valido(valor) ? valor : null;
  } catch {
    return null;
  }
}

function guardar(clave: string, valor: string): void {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // sin almacenamiento: se vuelve a pedir en cada carga
  }
}
