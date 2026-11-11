import { supabase } from '@/lib/supabaseClient'

const COLS =
  'id, orden_id, version, estado, total_repuestos, total_mano_obra, total_otros, costo_interno, descuento, total, margen, notas, publicado_en, respondido_en, respuesta_via, motivo_rechazo, created_at'

export const presupuestosService = {
  listarPorOrden: (ordenId) => supabase.from('presupuestos').select(COLS).eq('orden_id', ordenId).order('version', { ascending: false }),

  ultimoPorEstado: (ordenIds, estado) =>
    supabase.from('presupuestos').select(COLS).in('orden_id', ordenIds).eq('estado', estado).order('version', { ascending: false }),

  items: (presupuestoId) =>
    supabase
      .from('presupuesto_items')
      .select('id, tipo, repuesto_id, descripcion, cantidad, costo_unitario, precio_unitario, subtotal, orden_visual')
      .eq('presupuesto_id', presupuestoId)
      .order('orden_visual'),

  // RPC: crea el borrador con los repuestos de la orden + la mano de obra (RF23, RF25)
  generar: (ordenId, manoObra, descripcion) =>
    supabase.rpc('generar_presupuesto', {
      p_orden: ordenId,
      p_mano_obra: manoObra,
      p_descripcion_mano_obra: descripcion || 'Mano de obra',
    }),

  // RPC: borrador → publicado; orden → esperando_aprobacion (RF26)
  publicar: (presupuestoId) => supabase.rpc('publicar_presupuesto', { p_presupuesto: presupuestoId }),

  // RPC: respuesta del cliente tomada por teléfono o en persona
  registrarRespuesta: (presupuestoId, aprobar, motivo, via = 'telefono') =>
    supabase.rpc('registrar_respuesta_presupuesto', {
      p_presupuesto: presupuestoId,
      p_aprobar: aprobar,
      p_motivo: motivo || null,
      p_via: via,
    }),

  actualizar: (id, cambios) => supabase.from('presupuestos').update(cambios).eq('id', id).select(COLS).single(),

  actualizarItem: (id, cambios) => supabase.from('presupuesto_items').update(cambios).eq('id', id),

  agregarItem: (item) => supabase.from('presupuesto_items').insert(item),

  eliminarItem: (id) => supabase.from('presupuesto_items').delete().eq('id', id),
}
