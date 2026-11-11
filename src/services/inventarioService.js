import { supabase } from '@/lib/supabaseClient'

const COLS_REP =
  'id, codigo, nombre, categoria_id, stock, stock_minimo, costo_promedio, precio_venta, activo, created_at, updated_at, categorias_repuesto(nombre)'

const limpiar = (t) => t.replace(/[%_,()]/g, ' ').trim()

export const inventarioService = {
  listarRepuestos({ texto, categoriaId, incluirInactivos = false, rango } = {}) {
    let q = supabase.from('repuestos').select(COLS_REP, { count: 'exact' })
    if (!incluirInactivos) q = q.eq('activo', true)
    if (categoriaId) q = q.eq('categoria_id', categoriaId)
    if (texto) {
      const t = limpiar(texto)
      q = q.or(`nombre.ilike.%${t}%,codigo.ilike.%${t}%`)
    }
    q = q.order('nombre')
    if (rango) q = q.range(rango[0], rango[1])
    return q
  },

  obtenerRepuesto: (id) => supabase.from('repuestos').select(COLS_REP).eq('id', id).maybeSingle(),

  // stock y costo_promedio solo se aceptan al crear (el trigger registra el movimiento "inicial")
  crearRepuesto: (r) =>
    supabase
      .from('repuestos')
      .insert({
        codigo: r.codigo.trim().toUpperCase(),
        nombre: r.nombre.trim(),
        categoria_id: r.categoria_id || null,
        stock: r.stock ?? 0,
        stock_minimo: r.stock_minimo ?? 0,
        costo_promedio: r.costo_promedio ?? 0,
        precio_venta: r.precio_venta,
      })
      .select(COLS_REP)
      .single(),

  actualizarRepuesto: (id, r) =>
    supabase
      .from('repuestos')
      .update({
        codigo: r.codigo.trim().toUpperCase(),
        nombre: r.nombre.trim(),
        categoria_id: r.categoria_id || null,
        stock_minimo: r.stock_minimo ?? 0,
        precio_venta: r.precio_venta,
        activo: r.activo,
      })
      .eq('id', id)
      .select(COLS_REP)
      .single(),

  movimientos: (repuestoId, rango) => {
    let q = supabase
      .from('movimientos_inventario')
      .select(
        'id, tipo, cantidad, costo_unitario, stock_resultante, costo_promedio_resultante, motivo, created_at, solicitud_id, perfiles(nombre_completo), ordenes_trabajo(id, codigo)',
        { count: 'exact' },
      )
      .eq('repuesto_id', repuestoId)
      .order('created_at', { ascending: false })
    if (rango) q = q.range(rango[0], rango[1])
    return q
  },

  // Entradas y ajustes; el trigger recalcula stock y costo promedio (RF28)
  registrarMovimiento: ({ repuesto_id, tipo, cantidad, costo_unitario, motivo, solicitud_id }) =>
    supabase
      .from('movimientos_inventario')
      .insert({
        repuesto_id,
        tipo,
        cantidad,
        costo_unitario: costo_unitario ?? 0,
        motivo: motivo?.trim() || null,
        solicitud_id: solicitud_id || null,
      })
      .select('id, stock_resultante, costo_promedio_resultante')
      .single(),

  stockBajo: () => supabase.from('v_stock_bajo').select('*').order('stock'),
}
