import { supabase } from '@/lib/supabaseClient'
import { ESTADOS_CERRADOS } from '@/lib/constants/estados'

const COLS_PANEL =
  'id, codigo, estado, estado_texto, etapa, patente, marca, modelo, anio, cliente, cliente_telefono, mecanico, mecanico_id, avance_pct, kilometraje, motivo_ingreso, fecha_ingreso, updated_at, horas_en_taller'

const COLS_ORDEN = `*,
  vehiculos(id, patente, marca, modelo, anio, color, vin),
  clientes(id, rut, nombre, telefono, correo),
  mecanico:perfiles!ordenes_trabajo_mecanico_id_fkey(id, nombre_completo),
  recepcionista:perfiles!ordenes_trabajo_recepcionista_id_fkey(id, nombre_completo)`

const limpiar = (t) => t.replace(/[%_,()]/g, ' ').trim()

export const ordenesService = {
  /**
   * Vista v_panel_ordenes con filtros. Devuelve { data, error, count }.
   */
  listarPanel({
    estados,
    excluirCerradas = false,
    mecanicoId,
    sinAsignar = false,
    texto,
    desde,
    orden = { col: 'fecha_ingreso', asc: false },
    rango,
    conteo = false,
  } = {}) {
    let q = supabase.from('v_panel_ordenes').select(COLS_PANEL, conteo ? { count: 'exact' } : undefined)
    if (estados?.length) q = q.in('estado', estados)
    if (excluirCerradas) q = q.not('estado', 'in', `(${ESTADOS_CERRADOS.join(',')})`)
    if (mecanicoId) q = q.eq('mecanico_id', mecanicoId)
    if (sinAsignar) q = q.is('mecanico_id', null)
    if (desde) q = q.gte('fecha_ingreso', desde)
    if (texto) {
      const t = limpiar(texto)
      q = q.or(`patente.ilike.%${t}%,cliente.ilike.%${t}%,codigo.ilike.%${t}%`)
    }
    q = q.order(orden.col, { ascending: orden.asc })
    if (rango) q = q.range(rango[0], rango[1])
    return q
  },

  listarPanelPorIds: (ids) => supabase.from('v_panel_ordenes').select(COLS_PANEL).in('id', ids),

  obtener: (id) => supabase.from('ordenes_trabajo').select(COLS_ORDEN).eq('id', id).maybeSingle(),

  obtenerPorCodigo: (codigo) => supabase.from('ordenes_trabajo').select('id, codigo').eq('codigo', codigo.trim().toUpperCase()).maybeSingle(),

  historial: (id) =>
    supabase.from('historial_estados').select('id, estado_anterior, estado_nuevo, actor_rol, usuario_id, nota, created_at').eq('orden_id', id).order('created_at'),

  diagnosticos: (id) =>
    supabase.from('diagnosticos').select('id, descripcion, created_at, perfiles(nombre_completo)').eq('orden_id', id).order('created_at'),

  tareas: (id) =>
    supabase.from('orden_tareas').select('id, descripcion, completada, completada_en, tarea_id, diagnostico_id').eq('orden_id', id).order('created_at'),

  repuestos: (id) =>
    supabase
      .from('orden_repuestos')
      .select('id, cantidad, costo_unitario, precio_unitario, created_at, repuestos(id, codigo, nombre)')
      .eq('orden_id', id)
      .order('created_at'),

  avances: (id) =>
    supabase.from('avances_orden').select('id, porcentaje, nota, created_at, perfiles(nombre_completo)').eq('orden_id', id).order('created_at', { ascending: false }),

  cambiarEstado: (ordenId, estado, nota) =>
    supabase.rpc('cambiar_estado_orden', { p_orden: ordenId, p_estado: estado, p_nota: nota || null }),

  asignarMecanico: (ordenId, mecanicoId) => supabase.rpc('asignar_mecanico', { p_orden: ordenId, p_mecanico: mecanicoId }),
}
