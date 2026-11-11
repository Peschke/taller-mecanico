import { supabase } from '@/lib/supabaseClient'
import { normalizarRut } from '@/lib/rut'

const COLS = 'id, rut, nombre, telefono, correo, auth_user_id, created_at, updated_at'

const limpiar = (t) => t.replace(/[%_,()]/g, ' ').trim()

const filaCliente = (c) => ({
  rut: normalizarRut(c.rut),
  nombre: c.nombre.trim(),
  telefono: c.telefono.trim(),
  correo: c.correo?.trim() ? c.correo.trim().toLowerCase() : null,
})

export const clientesService = {
  // RLS clientes_select: el cliente lee solo su fila (auth_user_id = auth.uid())
  obtenerPorAuth: (userId) =>
    supabase.from('clientes').select('id, rut, nombre, telefono, correo').eq('auth_user_id', userId).maybeSingle(),

  obtener: (id) => supabase.from('clientes').select(COLS).eq('id', id).maybeSingle(),

  obtenerPorRut: (rut) => supabase.from('clientes').select(COLS).eq('rut', normalizarRut(rut)).maybeSingle(),

  // Búsqueda por RUT, nombre o teléfono (RNF05)
  buscar: (texto, limite = 8) => {
    const t = limpiar(texto)
    const rut = t.replace(/\./g, '')
    return supabase
      .from('clientes')
      .select(COLS)
      .or(`nombre.ilike.%${t}%,rut.ilike.%${rut}%,telefono.ilike.%${t}%`)
      .order('nombre')
      .limit(limite)
  },

  // Listado con vehículos y última visita
  listar: ({ texto, rango } = {}) => {
    let q = supabase
      .from('clientes')
      .select(`${COLS}, vehiculos(id, patente), ordenes_trabajo(fecha_ingreso)`, { count: 'exact' })
      .order('fecha_ingreso', { referencedTable: 'ordenes_trabajo', ascending: false })
      .limit(1, { referencedTable: 'ordenes_trabajo' })
    if (texto) {
      const t = limpiar(texto)
      q = q.or(`nombre.ilike.%${t}%,rut.ilike.%${t.replace(/\./g, '')}%,telefono.ilike.%${t}%`)
    }
    q = q.order('nombre')
    if (rango) q = q.range(rango[0], rango[1])
    return q
  },

  crear: (c) => supabase.from('clientes').insert(filaCliente(c)).select(COLS).single(),

  // El RUT no se edita una vez creado
  actualizarContacto: (id, c) =>
    supabase
      .from('clientes')
      .update({
        nombre: c.nombre.trim(),
        telefono: c.telefono.trim(),
        correo: c.correo?.trim() ? c.correo.trim().toLowerCase() : null,
      })
      .eq('id', id)
      .select(COLS)
      .single(),

  vehiculos: (clienteId) =>
    supabase.from('vehiculos').select('id, patente, marca, modelo, anio, color, vin, created_at').eq('cliente_id', clienteId).order('patente'),

  ordenes: (clienteId) =>
    supabase
      .from('ordenes_trabajo')
      .select('id, codigo, estado, kilometraje, motivo_ingreso, observaciones_finales, fecha_ingreso, fecha_entrega, vehiculos(id, patente, marca, modelo)')
      .eq('cliente_id', clienteId)
      .order('fecha_ingreso', { ascending: false }),

  // Monto facturado = presupuestos aprobados de sus órdenes pagadas y cerradas
  facturado: async (clienteId) => {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('total, ordenes_trabajo!inner(cliente_id, estado)')
      .eq('estado', 'aprobado')
      .eq('ordenes_trabajo.cliente_id', clienteId)
      .eq('ordenes_trabajo.estado', 'pagado_cerrado')
    if (error) return { data: null, error }
    return { data: data.reduce((s, p) => s + Number(p.total), 0), error: null }
  },

  // Tareas completadas de sus últimas órdenes
  ultimosTrabajos: (clienteId, limite = 10) =>
    supabase
      .from('orden_tareas')
      .select('id, descripcion, completada_en, ordenes_trabajo!inner(id, codigo, cliente_id, fecha_ingreso, vehiculos(patente))')
      .eq('ordenes_trabajo.cliente_id', clienteId)
      .eq('completada', true)
      .order('completada_en', { ascending: false })
      .limit(limite),
}
