// Traduce errores de Supabase/PostgREST/Auth a mensajes para el usuario.
// Las excepciones del esquema (P0001, P0002) ya vienen en español y se muestran tal cual.

const POR_CODIGO = {
  23505: 'Ya existe un registro con esos datos.',
  23514: 'Algún dato no cumple las reglas del sistema (revisa RUT, patente, montos o campos obligatorios).',
  23503: 'El registro está relacionado con otros datos y no se puede modificar así.',
  23502: 'Falta completar un campo obligatorio.',
  42501: 'No tienes permiso para realizar esta acción.',
  PGRST116: 'No se encontró el registro.',
}

const POR_MENSAJE_AUTH = [
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/email not confirmed/i, 'Debes confirmar tu correo antes de ingresar.'],
  [/user is banned/i, 'Tu cuenta está desactivada. Contacta al administrador.'],
  [/rate limit|too many requests/i, 'Demasiados intentos. Espera un momento y vuelve a intentar.'],
  [/password should be at least/i, 'La contraseña debe tener al menos 6 caracteres.'],
  [/signups not allowed|otp_disabled/i, 'Este correo no tiene acceso habilitado.'],
  [/failed to fetch|networkerror|network request failed/i, 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.'],
]

export function traducirError(error) {
  if (!error) return null
  if (typeof error === 'string') return error

  const code = error.code ?? error.status
  const message = error.message ?? ''

  if (code === 'P0001' || code === 'P0002') return message
  if (code && POR_CODIGO[code]) return POR_CODIGO[code]

  for (const [patron, texto] of POR_MENSAJE_AUTH) {
    if (patron.test(message)) return texto
  }

  if (import.meta.env.DEV) console.error('[error no traducido]', error)
  return 'Ocurrió un error inesperado. Intenta nuevamente.'
}

// Lanza si la respuesta de Supabase trae error; devuelve data
export function unwrap({ data, error }) {
  if (error) throw error
  return data
}
