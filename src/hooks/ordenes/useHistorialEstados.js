import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { ordenesService } from '@/services/ordenesService'

export function useHistorialEstados(ordenId, deps = []) {
  return useSupabaseQuery(() => ordenesService.historial(ordenId), [ordenId, ...deps], {
    enabled: Boolean(ordenId),
    initialData: [],
  })
}
