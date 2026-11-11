/**
 * Marca del gimnasio a partir de un color base (#rrggbb) que elige el administrador: paleta de tonos,
 * fondo del menú para modo claro/nocturno y color de texto con contraste suficiente (WCAG AA).
 */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

// h en grados (0-360); s y v entre 0 y 1
export interface Hsv {
  h: number;
  s: number;
  v: number;
}

export const HEX_VALIDO = /^#[0-9a-f]{6}$/i;
export const COLOR_POR_DEFECTO = '#7f1d1d';
const BLANCO: Rgb = { r: 255, g: 255, b: 255 };
const NEGRO: Rgb = { r: 0, g: 0, b: 0 };
// Texto oscuro cuando el color base es claro (gray-900)
export const TEXTO_OSCURO = '#111827';

// Accesos rápidos en la rueda de color
export const COLORES_SUGERIDOS: readonly { nombre: string; hex: string }[] = [
  { nombre: 'Rojo', hex: '#7f1d1d' },
  { nombre: 'Naranja', hex: '#c2410c' },
  { nombre: 'Mostaza', hex: '#ca8a04' },
  { nombre: 'Verde', hex: '#14532d' },
  { nombre: 'Turquesa', hex: '#134e4a' },
  { nombre: 'Celeste', hex: '#0ea5e9' },
  { nombre: 'Azul', hex: '#1e3a8a' },
  { nombre: 'Morado', hex: '#4c1d95' },
  { nombre: 'Pizarra', hex: '#1e293b' },
  { nombre: 'Negro', hex: '#18181b' },
];

export const TONOS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;
export type Tono = (typeof TONOS)[number];

// Cuánto se mezcla con blanco (tonos claros) o con negro (tonos oscuros); el color base queda en 500
const MEZCLA: Record<Tono, { con: Rgb; peso: number }> = {
  '50': { con: BLANCO, peso: 0.95 },
  '100': { con: BLANCO, peso: 0.9 },
  '200': { con: BLANCO, peso: 0.75 },
  '300': { con: BLANCO, peso: 0.6 },
  '400': { con: BLANCO, peso: 0.3 },
  '500': { con: BLANCO, peso: 0 },
  '600': { con: NEGRO, peso: 0.15 },
  '700': { con: NEGRO, peso: 0.3 },
  '800': { con: NEGRO, peso: 0.45 },
  '900': { con: NEGRO, peso: 0.6 },
  '950': { con: NEGRO, peso: 0.75 },
};

export function esHexValido(valor: unknown): valor is string {
  return typeof valor === 'string' && HEX_VALIDO.test(valor);
}

export function hexARgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbAHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('');
}

export function hsvARgb({ h, s, v }: Hsv): Rgb {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255 };
}

export function rgbAHsv({ r, g, b }: Rgb): Hsv {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const d = max - Math.min(rr, gg, bb);
  let h = 0;
  if (d) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
}

export function mezclar(a: Rgb, b: Rgb, pesoB: number): Rgb {
  return { r: a.r + (b.r - a.r) * pesoB, g: a.g + (b.g - a.g) * pesoB, b: a.b + (b.b - a.b) * pesoB };
}

// Luminancia relativa y contraste según WCAG 2.x
function luminancia({ r, g, b }: Rgb): number {
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contraste(a: string, b: string): number {
  const [la, lb] = [luminancia(hexARgb(a)), luminancia(hexARgb(b))].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

export function paleta(base: string): Record<Tono, string> {
  const rgb = hexARgb(base);
  return Object.fromEntries(TONOS.map((t) => [t, rgbAHex(mezclar(rgb, MEZCLA[t].con, MEZCLA[t].peso))])) as Record<Tono, string>;
}

// Fondo del menú y de las cabeceras: el color base, o un tono más oscuro en modo nocturno
export function fondoMarca(base: string, oscuro: boolean): string {
  return oscuro ? rgbAHex(mezclar(hexARgb(base), NEGRO, 0.35)) : base.toLowerCase();
}

// Blanco si se lee bien sobre el fondo (AA: 4.5:1); si no, texto oscuro
export function textoSobre(fondo: string): string {
  return contraste(fondo, '#ffffff') >= 4.5 ? '#ffffff' : TEXTO_OSCURO;
}
