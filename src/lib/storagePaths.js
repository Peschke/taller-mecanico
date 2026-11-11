export const BUCKET_FOTOS = 'fotos-ordenes'
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
export const MAX_BYTES_FOTO = 10 * 1024 * 1024

// Las políticas de Storage leen el orden_id desde la primera carpeta de la ruta
export function rutaFoto(ordenId, file) {
  const ext = (file?.name?.split('.').pop() || 'jpg').toLowerCase()
  return `${ordenId}/${crypto.randomUUID()}.${ext}`
}

export function validarFoto(file) {
  if (!TIPOS_IMAGEN.includes(file.type)) return 'Formato no permitido (usa JPG, PNG, WebP o HEIC).'
  if (file.size > MAX_BYTES_FOTO) return 'La foto supera los 10 MB.'
  return null
}
