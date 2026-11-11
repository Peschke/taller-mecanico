import { supabase } from '@/lib/supabaseClient'

const COLS = 'id, nombre_completo, correo, telefono, rol, activo, created_at, updated_at'

// Convierte el error de una Edge Function en { message, code } legible por traducirError
async function errorDeFuncion(error) {
  let mensaje = error.message
  try {
    const body = await error.context?.json?.()
    if (body?.error) mensaje = body.error
  } catch {
    /* sin cuerpo JSON */
  }
  return { message: mensaje, code: 'P0001' }
}

async function invocar(body) {
  const { data, error } = await supabase.functions.invoke('crear-usuario', { body })
  if (error) return { data: null, error: await errorDeFuncion(error) }
  if (data?.error) return { data: null, error: { message: data.error, code: 'P0001' } }
  return { data, error: null }
}

export const usuariosService = {
  listar: () => supabase.from('perfiles').select(COLS).order('activo', { ascending: false }).order('nombre_completo'),

  obtener: (id) => supabase.from('perfiles').select(COLS).eq('id', id).maybeSingle(),

  // CU-08 / RF20: la Edge Function crea la cuenta en Auth con app_metadata.rol; el trigger crea el perfil
  crear: ({ nombre_completo, correo, telefono, rol, password }) =>
    invocar({ accion: 'crear', nombre: nombre_completo.trim(), email: correo.trim().toLowerCase(), telefono, rol, password }),

  // CU-08 FA / RF21: rol, datos y activo; al desactivar también bloquea el acceso en Auth
  actualizar: (id, { nombre_completo, telefono, rol, activo }) =>
    invocar({ accion: 'actualizar', id, nombre: nombre_completo?.trim(), telefono, rol, activo }),

  // Mapa id → nombre para auditoría e historial (el admin puede leer todos los perfiles)
  mapaNombres: async () => {
    const { data, error } = await supabase.from('perfiles').select('id, nombre_completo')
    if (error) return { data: null, error }
    return { data: Object.fromEntries(data.map((p) => [p.id, p.nombre_completo])), error: null }
  },
}
