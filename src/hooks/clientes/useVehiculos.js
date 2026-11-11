import { useCallback, useEffect, useState } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useDebounce } from '@/hooks/core/useDebounce'
import { vehiculosService } from '@/services/vehiculosService'
import { normalizarPatente, patenteValida } from '@/lib/patente'

export function useVehiculos({ texto = '', page = 0, pageSize = 20 } = {}) {
  const q = useSupabaseQuery(
    () => vehiculosService.listar({ texto: texto || undefined, rango: [page * pageSize, page * pageSize + pageSize - 1] }),
    [texto, page, pageSize],
    { initialData: [] },
  )
  return { ...q, vehiculos: q.data ?? [], total: q.count }
}

// Ficha del vehículo: datos, historial, diagnósticos previos, repuestos y orden abierta
export function useVehiculo(vehiculoId) {
  const q = useSupabaseQuery(
    async () => {
      const [v, o, d, r, a] = await Promise.all([
        vehiculosService.obtener(vehiculoId),
        vehiculosService.ordenes(vehiculoId),
        vehiculosService.diagnosticos(vehiculoId),
        vehiculosService.repuestos(vehiculoId),
        vehiculosService.ordenAbierta(vehiculoId),
      ])
      const err = v.error || o.error || d.error || r.error || a.error
      if (err) throw err
      return { vehiculo: v.data, ordenes: o.data, diagnosticos: d.data, repuestos: r.data, ordenAbierta: a.data }
    },
    [vehiculoId],
    { enabled: Boolean(vehiculoId) },
  )
  return { ...q, ficha: q.data }
}

/**
 * RF03 en tiempo real: valida la patente y verifica si ya existe.
 * estado: 'vacio' | 'invalida' | 'buscando' | 'existe' | 'nueva' | 'error'
 */
export function useVehiculoPorPatente(patente) {
  const debounced = useDebounce(normalizarPatente(patente), 400)
  const [res, setRes] = useState({ estado: 'vacio', vehiculo: null, ordenAbierta: null })
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    if (!debounced) return setRes({ estado: 'vacio', vehiculo: null, ordenAbierta: null })
    if (!patenteValida(debounced)) return setRes({ estado: 'invalida', vehiculo: null, ordenAbierta: null })
    let cancel = false
    setRes((r) => ({ ...r, estado: 'buscando' }))
    vehiculosService.obtenerPorPatente(debounced).then(async ({ data, error }) => {
      if (cancel) return
      if (error) return setRes({ estado: 'error', vehiculo: null, ordenAbierta: null })
      if (!data) return setRes({ estado: 'nueva', vehiculo: null, ordenAbierta: null })
      const { data: abierta } = await vehiculosService.ordenAbierta(data.id)
      if (!cancel) setRes({ estado: 'existe', vehiculo: data, ordenAbierta: abierta ?? null })
    })
    return () => {
      cancel = true
    }
  }, [debounced, recarga])

  const refrescar = useCallback(() => setRecarga((n) => n + 1), [])
  return { ...res, patente: debounced, refrescar }
}

export function useGuardarVehiculo() {
  const crear = useSupabaseMutation((clienteId, datos) => vehiculosService.crear(clienteId, datos))
  const actualizar = useSupabaseMutation((id, datos) => vehiculosService.actualizar(id, datos))
  return { crear: crear.mutate, actualizar: actualizar.mutate, pending: crear.pending || actualizar.pending }
}
