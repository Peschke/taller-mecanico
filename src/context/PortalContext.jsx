import { createContext, useCallback, useMemo, useState } from 'react'
import { normalizarPatente } from '@/lib/patente'

export const PortalContext = createContext(null)

const KEY = 'taller.portal'

function leer() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) ?? { patente: '', codigo: '' }
  } catch {
    return { patente: '', codigo: '' }
  }
}

export function PortalProvider({ children }) {
  const [cred, setCred] = useState(leer)

  const setCredenciales = useCallback((patente, codigo) => {
    const nuevo = { patente: normalizarPatente(patente), codigo: String(codigo ?? '').trim().toUpperCase() }
    setCred(nuevo)
    try {
      sessionStorage.setItem(KEY, JSON.stringify(nuevo))
    } catch {
      /* almacenamiento no disponible: se mantiene solo en memoria */
    }
  }, [])

  const clear = useCallback(() => {
    setCred({ patente: '', codigo: '' })
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* noop */
    }
  }, [])

  const value = useMemo(
    () => ({ ...cred, tieneCredenciales: Boolean(cred.patente && cred.codigo), setCredenciales, clear }),
    [cred, setCredenciales, clear],
  )

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}
