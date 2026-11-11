import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/core/useAuth'
import { notificacionesService } from '@/services/notificacionesService'
import { suscribirTabla } from '@/services/realtimeService'

export const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { user, rol, tipoCuenta, status } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const habilitado = status === 'ready' && tipoCuenta === 'staff' && user && rol

  const cargar = useCallback(async () => {
    if (!habilitado) return
    setLoading(true)
    const { data } = await notificacionesService.listarPropias(user.id, rol)
    setItems(data ?? [])
    setLoading(false)
  }, [habilitado, user, rol])

  useEffect(() => {
    if (!habilitado) {
      setItems([])
      return undefined
    }
    cargar()
    // Un canal por filtro: Realtime admite un solo filtro por suscripción
    const agregar = ({ new: n }) =>
      setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev].slice(0, 100)))
    const cerrarUsuario = suscribirTabla({
      table: 'notificaciones',
      event: 'INSERT',
      filter: `destinatario_usuario_id=eq.${user.id}`,
      onChange: agregar,
    })
    const cerrarRol = suscribirTabla({
      table: 'notificaciones',
      event: 'INSERT',
      filter: `destinatario_rol=eq.${rol}`,
      onChange: agregar,
    })
    return () => {
      cerrarUsuario()
      cerrarRol()
    }
  }, [habilitado, user, rol, cargar])

  const markAsRead = useCallback(async (id) => {
    const ahora = new Date().toISOString()
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, leida_en: ahora } : x)))
    await notificacionesService.marcarLeida(id)
  }, [])

  const markAllAsRead = useCallback(async () => {
    const ids = items.filter((x) => !x.leida_en).map((x) => x.id)
    if (!ids.length) return
    const ahora = new Date().toISOString()
    setItems((prev) => prev.map((x) => ({ ...x, leida_en: x.leida_en ?? ahora })))
    await notificacionesService.marcarLeidas(ids)
  }, [items])

  const value = useMemo(
    () => ({
      items,
      unreadCount: items.filter((x) => !x.leida_en).length,
      loading,
      enabled: Boolean(habilitado),
      reload: cargar,
      markAsRead,
      markAllAsRead,
    }),
    [items, loading, habilitado, cargar, markAsRead, markAllAsRead],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
