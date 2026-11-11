import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { ordenesService } from '@/services/ordenesService'

// Orden con vehículo, cliente, mecánico y recepcionista; se refresca sola si cambia
export function useOrden(ordenId) {
  const q = useSupabaseQuery(() => ordenesService.obtener(ordenId), [ordenId], { enabled: Boolean(ordenId) })
  useRealtimeTable({
    table: 'ordenes_trabajo',
    event: 'UPDATE',
    filter: ordenId ? `id=eq.${ordenId}` : undefined,
    enabled: Boolean(ordenId),
    onChange: () => q.refetch({ silencioso: true }),
  })
  return { ...q, orden: q.data }
}

// Detalle técnico de la orden: diagnósticos, tareas y repuestos
export function useDetalleTecnico(ordenId) {
  return useSupabaseQuery(
    async () => {
      const [d, t, r] = await Promise.all([
        ordenesService.diagnosticos(ordenId),
        ordenesService.tareas(ordenId),
        ordenesService.repuestos(ordenId),
      ])
      const err = d.error || t.error || r.error
      if (err) throw err
      return { diagnosticos: d.data, tareas: t.data, repuestos: r.data }
    },
    [ordenId],
    { enabled: Boolean(ordenId), initialData: { diagnosticos: [], tareas: [], repuestos: [] } },
  )
}
