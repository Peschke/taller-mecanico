import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { fotosService } from '@/services/fotosService'

export function useFotosOrden(ordenId) {
  return useSupabaseQuery(() => fotosService.listarConUrls(ordenId), [ordenId], { enabled: Boolean(ordenId), initialData: [] })
}
