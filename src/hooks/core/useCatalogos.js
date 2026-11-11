import { useContext } from 'react'
import { CatalogContext } from '@/context/CatalogContext'

export function useCatalogos() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalogos debe usarse dentro de <CatalogProvider>')
  return ctx
}
