import { supabase } from '@/lib/supabaseClient'

const limpiar = (t) => t.replace(/[%_,()]/g, ' ').trim()

export const recepcionService = {
  // CU-02 · RF04, RF05, RF07. El trigger fija estado 'por_asignar', recepcionista, código y código de seguimiento.
  crearOrden: ({ vehiculo_id, cliente_id, kilometraje, nivel_combustible, motivo_ingreso, observaciones_ingreso }) =>
    supabase
      .from('ordenes_trabajo')
      .insert({
        vehiculo_id,
        cliente_id,
        kilometraje: Number(String(kilometraje).replace(/\D/g, '')),
        nivel_combustible,
        motivo_ingreso: motivo_ingreso.trim(),
        observaciones_ingreso: observaciones_ingreso?.trim() || null,
      })
      .select('id, codigo, codigo_seguimiento, estado, fecha_ingreso')
      .single(),

  // Datos de ingreso que recepción puede corregir (el trigger de guarda impide tocar el resto)
  actualizarIngreso: (ordenId, { kilometraje, nivel_combustible, motivo_ingreso, observaciones_ingreso }) =>
    supabase
      .from('ordenes_trabajo')
      .update({
        kilometraje: Number(String(kilometraje).replace(/\D/g, '')),
        nivel_combustible,
        motivo_ingreso: motivo_ingreso.trim(),
        observaciones_ingreso: observaciones_ingreso?.trim() || null,
      })
      .eq('id', ordenId),

  // Órdenes terminadas pendientes de aviso, con la fecha de término (CU-03)
  porNotificar: () =>
    supabase
      .from('ordenes_trabajo')
      .select(
        'id, codigo, codigo_seguimiento, estado, fecha_termino, observaciones_finales, vehiculos(id, patente, marca, modelo), clientes(id, nombre, telefono, correo), mecanico:perfiles!ordenes_trabajo_mecanico_id_fkey(nombre_completo)',
      )
      .eq('estado', 'trabajo_terminado')
      .order('fecha_termino', { ascending: true }),

  // Datos para notificar una orden concreta
  ordenParaNotificar: (ordenId) =>
    supabase
      .from('ordenes_trabajo')
      .select('id, codigo, codigo_seguimiento, estado, fecha_termino, vehiculos(id, patente, marca, modelo), clientes(id, nombre, telefono, correo)')
      .eq('id', ordenId)
      .maybeSingle(),

  // Buscador global: código de orden o código de seguimiento
  buscarOrdenes: (texto, limite = 5) => {
    const t = limpiar(texto).toUpperCase()
    return supabase
      .from('ordenes_trabajo')
      .select('id, codigo, estado, vehiculos(patente), clientes(nombre)')
      .or(`codigo.ilike.%${t}%,codigo_seguimiento.eq.${t}`)
      .order('fecha_ingreso', { ascending: false })
      .limit(limite)
  },
}
