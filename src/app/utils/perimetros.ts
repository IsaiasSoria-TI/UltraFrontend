import { Control, Perimetros } from '../models/portal.model';

export type ClavePerimetro = keyof Perimetros;

export interface DefinicionPerimetro {
  clave: ClavePerimetro;
  etiqueta: string;
  // Dónde se mide: así todos los entrenadores toman la medida igual
  ayuda: string;
}

// Mismo orden en el formulario, el historial y el portal (de arriba hacia abajo del cuerpo)
export const PERIMETROS: readonly DefinicionPerimetro[] = [
  { clave: 'cuello', etiqueta: 'Cuello', ayuda: 'Debajo de la nuez' },
  { clave: 'hombros', etiqueta: 'Hombros', ayuda: 'A la altura de los deltoides' },
  { clave: 'pecho', etiqueta: 'Pecho', ayuda: 'A la altura de los pezones' },
  { clave: 'biceps', etiqueta: 'Bíceps', ayuda: 'Brazo derecho contraído' },
  { clave: 'antebrazo', etiqueta: 'Antebrazo', ayuda: 'Derecho, parte más ancha' },
  { clave: 'cintura', etiqueta: 'Cintura', ayuda: 'Parte más estrecha' },
  { clave: 'abdomen', etiqueta: 'Abdomen', ayuda: 'A la altura del ombligo' },
  { clave: 'cadera', etiqueta: 'Cadera', ayuda: 'Parte más ancha de los glúteos' },
  { clave: 'muslo', etiqueta: 'Muslo', ayuda: 'Derecho, debajo del glúteo' },
  { clave: 'pantorrilla', etiqueta: 'Pantorrilla', ayuda: 'Derecha, parte más ancha' },
];

export const PERIMETRO_MIN = 10;
export const PERIMETRO_MAX = 300;

export interface PerimetroMedido {
  clave: ClavePerimetro;
  etiqueta: string;
  valor: number;
  // Respecto al control anterior que también midió ese perímetro; null si es la primera medida
  variacion: number | null;
}

/**
 * Perímetros medidos en controles[indice]. Los controles van del más reciente al más antiguo,
 * así que el "anterior" de cada perímetro es el siguiente de la lista que lo tenga.
 */
export function perimetrosMedidos(controles: readonly Control[], indice: number): PerimetroMedido[] {
  const actual = controles[indice]?.perimetros;
  if (!actual) return [];
  return PERIMETROS.flatMap(({ clave, etiqueta }) => {
    const valor = actual[clave];
    if (valor === null) return [];
    const anterior = controles.slice(indice + 1).find((c) => c.perimetros?.[clave] != null)?.perimetros?.[clave] ?? null;
    return [{ clave, etiqueta, valor, variacion: anterior === null ? null : redondear(valor - anterior) }];
  });
}

// Última medida de cada perímetro (de cualquier control), para mostrarla como referencia al registrar
export function ultimosPerimetros(controles: readonly Control[]): Partial<Record<ClavePerimetro, number>> {
  const ultimos: Partial<Record<ClavePerimetro, number>> = {};
  for (const { clave } of PERIMETROS) {
    const valor = controles.find((c) => c.perimetros?.[clave] != null)?.perimetros?.[clave];
    if (valor != null) ultimos[clave] = valor;
  }
  return ultimos;
}

// Un decimal, como la columna de la base de datos
export function redondear(valor: number): number {
  return Math.round(valor * 10) / 10;
}
