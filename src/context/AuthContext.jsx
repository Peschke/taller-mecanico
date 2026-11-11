import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '@/services/authService'
import { perfilesService } from '@/services/perfilesService'
import { clientesService } from '@/services/clientesService'
import { ROLES } from '@/lib/constants/roles'
import { traducirError } from '@/lib/errors'

export const AuthContext = createContext(null)

const CUENTA_VACIA = { userId: null, tipo: null, perfil: null, cliente: null, motivo: null }
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// Resuelve quién es el usuario según el esquema: perfiles (personal) → clientes (portal) → sin acceso
async function resolverCuenta(userId, intentosCliente = 3) {
  const { data: perfil, error: errPerfil } = await perfilesService.obtenerPropio(userId)
  if (errPerfil) return { ...CUENTA_VACIA, userId, tipo: 'sin_acceso', motivo: 'error' }

  if (perfil) {
    if (!perfil.activo) return { ...CUENTA_VACIA, userId, tipo: 'sin_acceso', perfil, motivo: 'desactivada' }
    return { ...CUENTA_VACIA, userId, tipo: 'staff', perfil }
  }

  // El vínculo cliente↔auth lo hace un trigger al confirmar el correo; puede tardar un instante
  for (let i = 0; i < intentosCliente; i += 1) {
    const { data: cliente, error } = await clientesService.obtenerPorAuth(userId)
    if (error) return { ...CUENTA_VACIA, userId, tipo: 'sin_acceso', motivo: 'error' }
    if (cliente) return { ...CUENTA_VACIA, userId, tipo: 'cliente', cliente }
    if (i < intentosCliente - 1) await esperar(600)
  }
  return { ...CUENTA_VACIA, userId, tipo: 'sin_acceso', motivo: 'sin-vinculo' }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [initialized, setInitialized] = useState(false)
  const [cuenta, setCuenta] = useState(CUENTA_VACIA)
  const [recovery, setRecovery] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // 1) Sesión de Supabase Auth. El callback no llama a Supabase (evita bloqueos de supabase-js).
  useEffect(() => {
    let activo = true
    authService.getSession().then(({ data }) => {
      if (!activo) return
      setSession(data.session)
      setInitialized(true)
    })
    const { data } = authService.onAuthStateChange((event, nuevaSesion) => {
      setSession(nuevaSesion)
      setInitialized(true)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
    })
    return () => {
      activo = false
      data.subscription.unsubscribe()
    }
  }, [])

  // 2) Cuenta (perfil o cliente) cada vez que cambia el usuario
  const userId = session?.user?.id ?? null
  useEffect(() => {
    if (!userId) {
      setCuenta(CUENTA_VACIA)
      return
    }
    let cancelado = false
    resolverCuenta(userId).then((c) => {
      if (!cancelado) setCuenta(c)
    })
    return () => {
      cancelado = true
    }
  }, [userId, reloadKey])

  const status = !initialized || (userId && cuenta.userId !== userId) ? 'loading' : 'ready'

  const rol = cuenta.tipo === 'staff' ? cuenta.perfil.rol : cuenta.tipo === 'cliente' ? ROLES.CLIENTE : null

  const envolver = useCallback(async (fn) => {
    const { data, error } = await fn()
    return error ? { ok: false, error: traducirError(error) } : { ok: true, data }
  }, [])

  const value = useMemo(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      tipoCuenta: cuenta.tipo,
      perfil: cuenta.perfil,
      cliente: cuenta.cliente,
      motivoSinAcceso: cuenta.motivo,
      rol,
      recovery,
      signInStaff: (email, password) => envolver(() => authService.signInStaff(email, password)),
      signInCliente: (email) => envolver(() => authService.signInCliente(email)),
      resetPassword: (email) => envolver(() => authService.resetPassword(email)),
      updatePassword: async (password) => {
        const r = await envolver(() => authService.updatePassword(password))
        if (r.ok) setRecovery(false)
        return r
      },
      signOut: async () => {
        await authService.signOut()
        setCuenta(CUENTA_VACIA)
      },
      refreshCuenta: () => setReloadKey((k) => k + 1),
    }),
    [status, session, cuenta, rol, recovery, envolver],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
