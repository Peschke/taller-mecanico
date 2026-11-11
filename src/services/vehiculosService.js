import { supabase } from '@/lib/supabaseClient'
import { normalizarPatente } from '@/lib/patente'
import { ESTADOS_CERRADOS } from '@/lib/constants/estados'

const COLS = 'id, patente, marca, modelo, anio, color, vin, cliente_id, created_at, updated_at, clientes(id, rut, nombre, telefono, correo)'

const limpiar = (t) => t.replace(/[%_,()]/g, ' ').trim()

const filaVehiculo = (v) => ({
  marca: v.marca.trim(),
  modelo: v.modelo.trim(),
  anio: Number(v.anio),
  color: v.color?.trim() || null,
  vin: v.vin?.trim() ? v.vin.trim().toUpperCase() : null,
})

export const vehiculosService = {
  buscarPorPatenteParcial: (texto, limite = 8) =>
    supabase.from('vehiculos').select(COLS).ilike('patente', `%${normalizarPatente(texto)}%`).order('patente').limit(limite),

  // Patente, marca o modelo
  buscar: (texto, limite = 8) => {
    const t = limpiar(texto)
    const p = normalizarPatente(texto)
    const filtros = [`marca.ilike.%${t}%`, `modelo.ilike.%${t}%`]
    if (p) filtros.unshift(`patente.ilike.%${p}%`)
    return supabase.from('vehiculos').select(COLS).or(filtros.join(',')).order('patente').limit(limite)
  },

  // RF03: verificar existencia exacta de la patente
  obtenerPorPatente: (patente) => supabase.from('vehiculos').select(COLS).eq('patente', normalizarPatente(patente)).maybeSingle(),

  obtener: (id) => supabase.from('vehiculos').select(COLS).eq('id', id).maybeSingle(),

  listar: ({ texto, rango } = {}) => {
    let q = supabase
      .from('vehiculos')
      .select(`${COLS}, ordenes_trabajo(id, fecha_ingreso, estado)`, { count: 'exact' })
      .order('fecha_ingreso', { referencedTable: 'ordenes_trabajo', ascending: false })
      .limit(1, { referencedTable: 'ordenes_trabajo' })
    if (texto) {
      const t = limpiar(texto)
      const p = normalizarPatente(texto)
      const filtros = [`marca.ilike.%${t}%`, `modelo.ilike.%${t}%`]
      if (p) filtros.unshift(`patente.ilike.%${p}%`)
      q = q.or(filtros.join(','))
    }
    q = q.order('patente')
    if (rango) q = q.range(rango[0], rango[1])
    return q
  },

  crear: (clienteId, v) =>
    supabase
      .from('vehiculos')
      .insert({ ...filaVehiculo(v), patente: normalizarPatente(v.patente), cliente_id: clienteId })
      .select(COLS)
      .single(),

  actualizar: (id, v) => supabase.from('vehiculos').update(filaVehiculo(v)).eq('id', id).select(COLS).single(),

  // Una orden abierta por vehículo (índice ux_orden_abierta_por_vehiculo)
  ordenAbierta: (vehiculoId) =>
    supabase
      .from('ordenes_trabajo')
      .select('id, codigo, estado')
      .eq('vehiculo_id', vehiculoId)
      .not('estado', 'in', `(${ESTADOS_CERRADOS.join(',')})`)
      .maybeSingle(),

  ordenes: (vehiculoId) =>
    supabase
      .from('ordenes_trabajo')
      .select('id, codigo, estado, kilometraje, nivel_combustible, motivo_ingreso, observaciones_finales, fecha_ingreso, fecha_termino, fecha_entrega, clientes(nombre)')
      .eq('vehiculo_id', vehiculoId)
      .order('fecha_ingreso', { ascending: false }),

  diagnosticos: (vehiculoId) =>
    supabase
      .from('diagnosticos')
      .select('id, descripcion, created_at, perfiles(nombre_completo), ordenes_trabajo!inner(id, codigo, vehiculo_id, kilometraje)')
      .eq('ordenes_trabajo.vehiculo_id', vehiculoId)
      .order('created_at', { ascending: false }),

  repuestos: (vehiculoId) =>
    supabase
      .from('orden_repuestos')
      .select('id, cantidad, precio_unitario, created_at, repuestos(id, codigo, nombre), ordenes_trabajo!inner(id, codigo, vehiculo_id, fecha_ingreso, kilometraje)')
      .eq('ordenes_trabajo.vehiculo_id', vehiculoId)
      .order('created_at', { ascending: false }),

  ultimoKilometraje: (vehiculoId) =>
    supabase
      .from('ordenes_trabajo')
      .select('kilometraje, fecha_ingreso')
      .eq('vehiculo_id', vehiculoId)
      .order('fecha_ingreso', { ascending: false })
      .limit(1)
      .maybeSingle(),
}
