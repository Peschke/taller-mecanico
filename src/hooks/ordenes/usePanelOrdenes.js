import { useRef } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { ordenesService } from '@/services/ordenesService'

/**
 * Lee v_panel_ordenes y la vuelve a leer (debounce 500 ms) ante cambios en ordenes_trabajo (RNF02).
 * filtros: ver ordenesService.listarPanel
 */
export function usePanelOrdenes(filtros = {}, { realtime = true, realtimeFilter } = {}) {
  const key = JSON.stringify(filtros)
  const q = useSupabaseQuery(() => ordenesService.listarPanel(filtros), [key], { initialData: [] })
  const timer = useRef(null)

  const status = useRealtimeTable({
    table: 'ordenes_trabajo',
    filter: realtimeFilter,
    enabled: realtime,
    onChange: () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => q.refetch({ silencioso: true }), 500)
    },
  })

  return { ...q, ordenes: q.data ?? [], total: q.count, realtimeStatus: status }
}
