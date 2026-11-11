import { useCallback, useMemo } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { presupuestosService } from '@/services/presupuestosService'
import { traducirError } from '@/lib/errors'

/**
 * Presupuestos de una orden. "actual" = el borrador si existe; si no, la versión más reciente.
 */
export function usePresupuesto(ordenId) {
  const lista = useSupabaseQuery(() => presupuestosService.listarPorOrden(ordenId), [ordenId], {
    enabled: Boolean(ordenId),
    initialData: [],
  })

  const actual = useMemo(() => {
    const ps = lista.data ?? []
    return ps.find((p) => p.estado === 'borrador') ?? ps[0] ?? null
  }, [lista.data])

  const items = useSupabaseQuery(() => presupuestosService.items(actual.id), [actual?.id], {
    enabled: Boolean(actual?.id),
    initialData: [],
  })

  const recargar = useCallback(async () => {
    await lista.refetch({ silencioso: true })
    await items.refetch({ silencioso: true })
  }, [lista, items])

  const ejecutar = useCallback(
    async (fn) => {
      const { data, error } = await fn()
      if (error) return { ok: false, error: traducirError(error) }
      await recargar()
      return { ok: true, data }
    },
    [recargar],
  )

  return {
    presupuestos: lista.data ?? [],
    actual,
    items: items.data ?? [],
    loading: lista.loading || (Boolean(actual) && items.loading && !items.data?.length),
    error: lista.error || items.error,
    recargar,
    generar: (manoObra, descripcion) => ejecutar(() => presupuestosService.generar(ordenId, manoObra, descripcion)),
    publicar: () => ejecutar(() => presupuestosService.publicar(actual.id)),
    registrarRespuesta: (aprobar, motivo, via) => ejecutar(() => presupuestosService.registrarRespuesta(actual.id, aprobar, motivo, via)),
    actualizar: (cambios) => ejecutar(() => presupuestosService.actualizar(actual.id, cambios)),
    actualizarItem: (id, cambios) => ejecutar(() => presupuestosService.actualizarItem(id, cambios)),
    agregarItem: (item) => ejecutar(() => presupuestosService.agregarItem({ ...item, presupuesto_id: actual.id })),
    eliminarItem: (id) => ejecutar(() => presupuestosService.eliminarItem(id)),
  }
}
