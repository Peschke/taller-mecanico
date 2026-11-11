import { supabase } from '@/lib/supabaseClient'

const COLS = 'id, orden_id, tipo, canal, mensaje, estado, error_detalle, enviada_en, leida_en, created_at, destinatario_usuario_id, destinatario_rol, destinatario_cliente_id'

// RLS deja a admin y recepción leer todas las notificaciones; el filtro .or() limita a las propias
const filtroPropias = (userId, rol) => `destinatario_usuario_id.eq.${userId},destinatario_rol.eq.${rol}`

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

export const notificacionesService = {
  listarPropias: (userId, rol, { soloNoLeidas = false, limite = 50 } = {}) => {
    let q = supabase.from('notificaciones').select(COLS).or(filtroPropias(userId, rol))
    if (soloNoLeidas) q = q.is('leida_en', null)
    return q.order('created_at', { ascending: false }).limit(limite)
  },

  marcarLeida: (id) => supabase.from('notificaciones').update({ leida_en: new Date().toISOString() }).eq('id', id),

  marcarLeidas: (ids) => supabase.from('notificaciones').update({ leida_en: new Date().toISOString() }).in('id', ids),

  // Avisos al cliente de una orden (historial de CU-03)
  avisosCliente: (ordenId) =>
    supabase.from('notificaciones').select(COLS).eq('orden_id', ordenId).not('destinatario_cliente_id', 'is', null).order('created_at', { ascending: false }),

  /**
   * RF09 y WhatsApp asistido: registra el aviso como ya enviado.
   * El trigger fn_notificacion_after pasa la orden de Trabajo Terminado a Listo para Entrega.
   */
  registrarAvisoManual: ({ ordenId, clienteId, canal, mensaje }) =>
    supabase
      .from('notificaciones')
      .insert({
        orden_id: ordenId,
        tipo: 'vehiculo_listo',
        canal,
        destinatario_cliente_id: clienteId,
        mensaje,
        estado: 'enviada',
      })
      .select(COLS)
      .single(),

  /**
   * RF08: crea el aviso pendiente y la Edge Function notificar-cliente lo envía por correo
   * y lo marca 'enviada' o 'fallida'. Si queda enviada, el trigger cambia la orden a Listo para Entrega.
   */
  enviarCorreo: async ({ ordenId, clienteId, mensaje }) => {
    const { data: notif, error } = await supabase
      .from('notificaciones')
      .insert({
        orden_id: ordenId,
        tipo: 'vehiculo_listo',
        canal: 'email',
        destinatario_cliente_id: clienteId,
        mensaje,
        estado: 'pendiente',
      })
      .select(COLS)
      .single()
    if (error) return { data: null, error }

    const { data, error: fnError } = await supabase.functions.invoke('notificar-cliente', { body: { notificacion_id: notif.id } })
    if (fnError) return { data: null, error: await errorDeFuncion(fnError) }
    if (data?.error) return { data: null, error: { message: data.error, code: 'P0001' } }
    return { data, error: null }
  },
}
