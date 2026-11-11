// CU-03 · RF08: envía por correo el aviso "vehículo listo" de una fila de notificaciones
// y la marca 'enviada' o 'fallida'. Al quedar 'enviada', el trigger fn_notificacion_after
// cambia la orden de trabajo_terminado a listo_entrega.
//
// Secrets requeridos (supabase secrets set ...):
//   RESEND_API_KEY        clave de https://resend.com
//   NOTIFICACIONES_FROM   remitente verificado, ej: "Taller <avisos@tutaller.cl>"
//   APP_URL (opcional)    URL pública del frontend para el enlace de seguimiento
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('NOTIFICACIONES_FROM')
  const appUrl = Deno.env.get('APP_URL')

  // Solo recepción o administración
  const asUser = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const { data: u } = await asUser.auth.getUser()
  if (!u?.user) return json({ error: 'Sesión no válida' }, 401)

  const admin = createClient(url, service, { auth: { persistSession: false } })
  const { data: perfil } = await admin.from('perfiles').select('rol, activo').eq('id', u.user.id).maybeSingle()
  if (!perfil?.activo || !['admin', 'recepcionista'].includes(perfil.rol)) return json({ error: 'Sin permiso para notificar clientes' }, 403)

  let body: { notificacion_id?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400)
  }
  if (!body.notificacion_id) return json({ error: 'Falta notificacion_id' }, 400)

  const { data: n } = await admin
    .from('notificaciones')
    .select('id, canal, estado, mensaje, orden_id, destinatario_cliente_id, clientes(nombre, correo), ordenes_trabajo(codigo, codigo_seguimiento, vehiculos(patente, marca, modelo))')
    .eq('id', body.notificacion_id)
    .maybeSingle()
  if (!n) return json({ error: 'Notificación no encontrada' }, 404)
  if (n.estado === 'enviada') return json({ ok: true, yaEnviada: true })
  if (n.canal !== 'email') return json({ error: 'Esta función solo envía correos' }, 400)

  const fallar = async (detalle: string, status = 502) => {
    await admin.from('notificaciones').update({ estado: 'fallida', error_detalle: detalle }).eq('id', n.id)
    return json({ error: detalle }, status)
  }

  // deno-lint-ignore no-explicit-any
  const cliente = n.clientes as any
  // deno-lint-ignore no-explicit-any
  const orden = n.ordenes_trabajo as any
  if (!cliente?.correo) return fallar('El cliente no tiene correo registrado', 400)
  if (!resendKey || !from) return fallar('El envío de correos no está configurado (RESEND_API_KEY / NOTIFICACIONES_FROM)', 503)

  const v = orden?.vehiculos
  const enlace = appUrl ? `${appUrl.replace(/\/$/, '')}/seguimiento` : null
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2328;max-width:560px">
      <h2 style="margin:0 0 12px">Tu vehículo está listo</h2>
      <p>${escapar(n.mensaje).replace(/\n/g, '<br>')}</p>
      <table style="margin:16px 0;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#57606a">Vehículo</td><td><strong>${escapar(`${v?.marca ?? ''} ${v?.modelo ?? ''}`)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#57606a">Patente</td><td><strong>${escapar(v?.patente ?? '')}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#57606a">Orden</td><td>${escapar(orden?.codigo ?? '')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#57606a">Código de seguimiento</td><td>${escapar(orden?.codigo_seguimiento ?? '')}</td></tr>
      </table>
      ${enlace ? `<p><a href="${enlace}">Ver el estado y el presupuesto en línea</a></p>` : ''}
    </div>`

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [cliente.correo],
      subject: `Tu vehículo ${v?.patente ?? ''} está listo para retiro`,
      html,
      text: n.mensaje,
    }),
  })

  if (!r.ok) {
    const detalle = await r.text()
    return fallar(`El proveedor de correo rechazó el envío: ${detalle.slice(0, 300)}`)
  }

  // Marca enviada: el trigger pasa la orden a listo_entrega
  const { error } = await admin.from('notificaciones').update({ estado: 'enviada', enviada_en: new Date().toISOString(), error_detalle: null }).eq('id', n.id)
  if (error) return json({ error: `Correo enviado, pero no se pudo actualizar el estado: ${error.message}` }, 500)
  return json({ ok: true })
})
