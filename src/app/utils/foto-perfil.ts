/**
 * Foto de perfil: se recorta al centro (cuadrada) y se reduce a 256 x 256 en el navegador antes de
 * subirla, así pesa ~10-40 KB aunque la original sea una foto de celular de varios MB.
 * El backend vuelve a validar tipo, peso (200 KB) y dimensiones.
 */
export const FOTO_LADO = 256;
export const FOTO_LADO_MINIMO = 128;
export const FOTO_MAX_MB = 5;
export const FOTO_TIPOS = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Texto de ayuda con los tamaños recomendados (se muestra junto al botón de subir)
export const FOTO_RECOMENDACION =
  `JPG, PNG o WebP de hasta ${FOTO_MAX_MB} MB. Recomendado: imagen cuadrada de al menos ` +
  `${FOTO_LADO} × ${FOTO_LADO} px; se recorta al centro y se guarda en ${FOTO_LADO} × ${FOTO_LADO} px.`;

export class ErrorFoto extends Error {}

export async function prepararFotoPerfil(archivo: File): Promise<Blob> {
  if (!(FOTO_TIPOS as readonly string[]).includes(archivo.type)) {
    throw new ErrorFoto('La foto debe ser JPG, PNG o WebP.');
  }
  if (archivo.size > FOTO_MAX_MB * 1024 * 1024) {
    throw new ErrorFoto(`La foto pesa más de ${FOTO_MAX_MB} MB. Elige una más liviana.`);
  }

  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo);
  } catch {
    throw new ErrorFoto('No se pudo leer la imagen; puede estar dañada.');
  }
  try {
    if (imagen.width < FOTO_LADO_MINIMO || imagen.height < FOTO_LADO_MINIMO) {
      throw new ErrorFoto(`La foto es muy pequeña. Usa una de al menos ${FOTO_LADO} × ${FOTO_LADO} px.`);
    }
    const lado = Math.min(imagen.width, imagen.height);
    const lienzo = document.createElement('canvas');
    lienzo.width = FOTO_LADO;
    lienzo.height = FOTO_LADO;
    const ctx = lienzo.getContext('2d');
    if (!ctx) throw new ErrorFoto('Tu navegador no pudo procesar la imagen.');
    // Fondo blanco: un PNG transparente no queda negro al guardarse en JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, FOTO_LADO, FOTO_LADO);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imagen, (imagen.width - lado) / 2, (imagen.height - lado) / 2, lado, lado, 0, 0, FOTO_LADO, FOTO_LADO);

    // WebP si el navegador sabe generarlo; si no, JPEG
    const webp = await aBlob(lienzo, 'image/webp');
    if (webp?.type === 'image/webp') return webp;
    const jpeg = await aBlob(lienzo, 'image/jpeg');
    if (!jpeg) throw new ErrorFoto('Tu navegador no pudo procesar la imagen.');
    return jpeg;
  } finally {
    imagen.close();
  }
}

function aBlob(lienzo: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolve) => lienzo.toBlob(resolve, tipo, 0.85));
}
