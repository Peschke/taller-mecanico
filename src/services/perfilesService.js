import { supabase } from '@/lib/supabaseClient'

const COLS = 'id, nombre_completo, correo, telefono, rol, activo'

export const perfilesService = {
  // RLS perfiles_select: cada usuario puede leer su propia fila
  obtenerPropio: (userId) => supabase.from('perfiles').select(COLS).eq('id', userId).maybeSingle(),

  listarMecanicosActivos: () =>
    supabase.from('perfiles').select('id, nombre_completo').eq('rol', 'mecanico').eq('activo', true).order('nombre_completo'),

  actualizarTelefono: (userId, telefono) =>
    supabase.from('perfiles').update({ telefono }).eq('id', userId).select(COLS).single(),
}
