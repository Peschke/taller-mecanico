import { useContext } from 'react'
import { PortalContext } from '@/context/PortalContext'

export function usePortal() {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal debe usarse dentro de <PortalProvider>')
  return ctx
}
