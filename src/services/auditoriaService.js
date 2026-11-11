import { supabase } from '@/lib/supabaseClient'

export const TABLAS_AUDITADAS = [
  'ordenes_trabajo',
  'fotos_orden',
  'diagnosticos',
  'orden_tareas',
  'orden_repuestos',
  'presupuestos',
  'presupuesto_items',
  'pagos',
  'avances_orden',
  'perfiles',
  'clientes',
  'vehiculos',
  'repuestos',
  'solicitudes_compra',
]

export const auditoriaService = {
  // RNF12. RLS: solo admin
  listar: ({ tabla, ordenId, usuarioId, accion, desde, hasta, rango } = {}) => {
    let q = supabase
      .from('auditoria')
      .select('id, tabla, registro_id, orden_id, accion, datos_antes, datos_despues, usuario_id, rol, created_at', { count: 'exact' })
    if (tabla) q = q.eq('tabla', tabla)
    if (ordenId) q = q.eq('orden_id', ordenId)
    if (usuarioId) q = q.eq('usuario_id', usuarioId)
    if (accion) q = q.eq('accion', accion)
    if (desde) q = q.gte('created_at', desde)
    if (hasta) q = q.lt('created_at', hasta)
    q = q.order('created_at', { ascending: false })
    if (rango) q = q.range(rango[0], rango[1])
    return q
  },
}
