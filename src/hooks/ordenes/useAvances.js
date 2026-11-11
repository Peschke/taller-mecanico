import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { ordenesService } from '@/services/ordenesService'

export function useAvances(ordenId) {
  const q = useSupabaseQuery(() => ordenesService.avances(ordenId), [ordenId], { enabled: Boolean(ordenId), initialData: [] })
  useRealtimeTable({
    table: 'avances_orden',
    event: 'INSERT',
    filter: ordenId ? `orden_id=eq.${ordenId}` : undefined,
    enabled: Boolean(ordenId),
    onChange: () => q.refetch({ silencioso: true }),
  })
  return q
}
