import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { ordenesService } from '@/services/ordenesService'

// RPC cambiar_estado_orden(p_orden, p_estado, p_nota)
export function useCambiarEstado() {
  const m = useSupabaseMutation((ordenId, estado, nota) => ordenesService.cambiarEstado(ordenId, estado, nota))
  return { cambiarEstado: m.mutate, pending: m.pending, error: m.error }
}
