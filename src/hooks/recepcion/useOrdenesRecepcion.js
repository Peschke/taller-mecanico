import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { recepcionService } from '@/services/recepcionService'
import { vehiculosService } from '@/services/vehiculosService'

// CU-02: datos del vehículo para abrir la orden (dueño, orden abierta y último kilometraje)
export function useVehiculoParaOrden(vehiculoId) {
  return useSupabaseQuery(
    async () => {
      const [v, a, k] = await Promise.all([
        vehiculosService.obtener(vehiculoId),
        vehiculosService.ordenAbierta(vehiculoId),
        vehiculosService.ultimoKilometraje(vehiculoId),
      ])
      const err = v.error || a.error || k.error
      if (err) throw err
      return { vehiculo: v.data, ordenAbierta: a.data, ultimo: k.data }
    },
    [vehiculoId],
    { enabled: Boolean(vehiculoId) },
  )
}

export function useCrearOrden() {
  const m = useSupabaseMutation((datos) => recepcionService.crearOrden(datos))
  return { crearOrden: m.mutate, pending: m.pending, error: m.error }
}

export function useActualizarIngreso() {
  const m = useSupabaseMutation((ordenId, datos) => recepcionService.actualizarIngreso(ordenId, datos))
  return { actualizarIngreso: m.mutate, pending: m.pending }
}
