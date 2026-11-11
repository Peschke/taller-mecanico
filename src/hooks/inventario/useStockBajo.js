import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { inventarioService } from '@/services/inventarioService'

export function useStockBajo() {
  return useSupabaseQuery(() => inventarioService.stockBajo(), [], { initialData: [] })
}
