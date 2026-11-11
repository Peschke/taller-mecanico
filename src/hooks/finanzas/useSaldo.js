import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { pagosService } from '@/services/pagosService'

// v_saldo_ordenes: total_aprobado, pagado, saldo
export function useSaldo(ordenId) {
  const q = useSupabaseQuery(() => pagosService.saldo(ordenId), [ordenId], { enabled: Boolean(ordenId) })
  return { ...q, saldo: q.data }
}
