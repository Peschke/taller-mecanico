import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/core/useAuth'
import { catalogosService } from '@/services/catalogosService'
import { perfilesService } from '@/services/perfilesService'

export const CatalogContext = createContext(null)

const VACIO = { transiciones: [], categorias: [], tareas: [], mecanicos: [] }

export function CatalogProvider({ children }) {
  const { tipoCuenta, status } = useAuth()
  const [datos, setDatos] = useState(VACIO)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [t, c, ta, m] = await Promise.all([
      catalogosService.transiciones(),
      catalogosService.categorias(),
      catalogosService.tareas(),
      perfilesService.listarMecanicosActivos(),
    ])
    const err = t.error || c.error || ta.error || m.error
    if (err) setError(err)
    setDatos({
      transiciones: t.data ?? [],
      categorias: c.data ?? [],
      tareas: ta.data ?? [],
      mecanicos: m.data ?? [],
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status !== 'ready') return
    if (tipoCuenta === 'staff') cargar()
    else setDatos(VACIO)
  }, [status, tipoCuenta, cargar])

  // Transiciones que un rol puede ejecutar desde un estado (sin las automáticas del sistema)
  const getTransiciones = useCallback(
    (estado, rol) => datos.transiciones.filter((t) => t.origen === estado && t.roles.includes(rol)),
    [datos.transiciones],
  )

  const value = useMemo(
    () => ({ ...datos, loading, error, reload: cargar, getTransiciones }),
    [datos, loading, error, cargar, getTransiciones],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
