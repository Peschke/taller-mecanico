import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import Toast from '@/components/ui/Toast'

export const ToastContext = createContext(null)

const DURACION = 4500

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const seq = useRef(0)

  const cerrar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (tipo, mensaje) => {
      if (!mensaje) return
      seq.current += 1
      const id = seq.current
      setToasts((t) => [...t.slice(-3), { id, tipo, mensaje }])
      setTimeout(() => cerrar(id), DURACION)
    },
    [cerrar],
  )

  const value = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} tipo={t.tipo} mensaje={t.mensaje} onClose={() => cerrar(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
