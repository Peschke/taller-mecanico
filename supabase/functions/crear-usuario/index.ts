// CU-08 · Administrar usuarios y permisos (RF20, RF21, RF22)
// Acciones: { accion: 'crear', email, password, nombre, rol, telefono }
//           { accion: 'actualizar', id, nombre?, telefono?, rol?, activo? }
// Solo un administrador activo puede invocarla. Las contraseñas las guarda Supabase Auth (bcrypt).
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ROLES = ['admin', 'recepcionista', 'mecanico']
const BAN_INDEFINIDO = '876000h' // ~100 años

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeader = req.headers.get('Authorization') ?? ''

  // 1) Quién llama
  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userErr } = await asUser.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Sesión no válida' }, 401)
  const callerId = userData.user.id

  const admin = createClient(url, service, { auth: { persistSession: false } })
  const { data: caller } = await admin.from('perfiles').select('rol, activo').eq('id', callerId).maybeSingle()
  if (!caller || caller.rol !== 'admin' || !caller.activo) return json({ error: 'Solo un administrador puede gestionar usuarios' }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400)
  }

  // 2) Crear
  if (body.accion === 'crear') {
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const nombre = String(body.nombre ?? '').trim()
    const rol = String(body.rol ?? '')
    const telefono = body.telefono ? String(body.telefono).trim() : null

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Correo inválido' }, 400)
    if (password.length < 8) return json({ error: 'La clave inicial debe tener al menos 8 caracteres' }, 400)
    if (!nombre) return json({ error: 'El nombre es obligatorio' }, 400)
    if (!ROLES.includes(rol)) return json({ error: 'Rol inválido' }, 400)

    const { data: creado, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { rol, nombre },
    })
    if (error) {
      const yaExiste = /already|registered|exists/i.test(error.message)
      return json({ error: yaExiste ? 'Ya existe una cuenta con ese correo' : error.message }, yaExiste ? 409 : 400)
    }

    // El trigger fn_nuevo_usuario_auth crea la fila en perfiles; aquí se completa el teléfono
    if (telefono) await admin.from('perfiles').update({ telefono }).eq('id', creado.user.id)
    const { data: perfil } = await admin.from('perfiles').select('*').eq('id', creado.user.id).maybeSingle()
    return json({ ok: true, perfil })
  }

  // 3) Actualizar (rol, datos, activar / desactivar)
  if (body.accion === 'actualizar') {
    const id = String(body.id ?? '')
    if (!id) return json({ error: 'Falta el usuario' }, 400)

    const { data: actual } = await admin.from('perfiles').select('*').eq('id', id).maybeSingle()
    if (!actual) return json({ error: 'Usuario no encontrado' }, 404)

    const cambios: Record<string, unknown> = {}
    if (typeof body.nombre === 'string' && body.nombre.trim()) cambios.nombre_completo = body.nombre.trim()
    if (body.telefono !== undefined) cambios.telefono = body.telefono ? String(body.telefono).trim() : null
    if (body.rol !== undefined) {
      if (!ROLES.includes(String(body.rol))) return json({ error: 'Rol inválido' }, 400)
      cambios.rol = body.rol
    }
    if (typeof body.activo === 'boolean') cambios.activo = body.activo

    if (id === callerId && (cambios.activo === false || (cambios.rol && cambios.rol !== 'admin'))) {
      return json({ error: 'No puedes desactivarte ni quitarte el rol de administrador' }, 400)
    }

    const { data: perfil, error } = await admin.from('perfiles').update(cambios).eq('id', id).select('*').single()
    if (error) return json({ error: error.message }, 400)

    // Mantiene Auth en sintonía: rol en app_metadata y bloqueo de sesión si se desactiva
    const authCambios: Record<string, unknown> = { app_metadata: { rol: perfil.rol, nombre: perfil.nombre_completo } }
    if (typeof body.activo === 'boolean') authCambios.ban_duration = body.activo ? 'none' : BAN_INDEFINIDO
    const { error: authErr } = await admin.auth.admin.updateUserById(id, authCambios)
    if (authErr) return json({ error: `Perfil actualizado, pero falló Auth: ${authErr.message}` }, 500)

    return json({ ok: true, perfil })
  }

  return json({ error: 'Acción no reconocida' }, 400)
})
