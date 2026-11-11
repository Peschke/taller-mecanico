import { supabase } from '@/lib/supabaseClient'

const COLS = `id, orden_id, repuesto_id, descripcion_repuesto, cantidad, estado, created_at, updated_at,
  repuestos(id, codigo, nombre, stock, costo_promedio),
  ordenes_trabajo(id, codigo, estado),
  solicitante:perfiles!solicitudes_compra_solicitado_por_fkey(nombre_completo)`

export const solicitudesService = {
  listar: ({ estado, repuestoId } = {}) => {
    let q = supabase.from('solicitudes_compra').select(COLS)
    if (estado) q = q.eq('estado', estado)
    if (repuestoId) q = q.eq('repuesto_id', repuestoId)
    return q.order('created_at', { ascending: false })
  },

  contarPorEstado: async () => {
    const { data, error } = await supabase.from('solicitudes_compra').select('estado')
    if (error) return { data: null, error }
    const cuenta = {}
    for (const r of data) cuenta[r.estado] = (cuenta[r.estado] ?? 0) + 1
    return { data: cuenta, error: null }
  },

  actualizar: async (id, cambios) => {
    const { data: u } = await supabase.auth.getUser()
    return supabase
      .from('solicitudes_compra')
      .update({ ...cambios, atendido_por: u?.user?.id ?? null })
      .eq('id', id)
  },

  crear: ({ orden_id, repuesto_id, descripcion_repuesto, cantidad }) =>
    supabase.from('solicitudes_compra').insert({ orden_id: orden_id || null, repuesto_id: repuesto_id || null, descripcion_repuesto, cantidad }),
}
