import { useEffect, useRef, useState } from 'react'
import { suscribirTabla } from '@/services/realtimeService'

/**
 * Escucha cambios de una tabla. Devuelve el estado del canal: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | null
 */
export function useRealtimeTable({ table, event = '*', filter, onChange, enabled = true }) {
  const [status, setStatus] = useState(null)
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    if (!enabled || !table) return undefined
    const cerrar = suscribirTabla({
      table,
      event,
      filter,
      onChange: (p) => cb.current?.(p),
      onStatus: setStatus,
    })
    return () => {
      cerrar()
      setStatus(null)
    }
  }, [table, event, filter, enabled])

  return status
}
