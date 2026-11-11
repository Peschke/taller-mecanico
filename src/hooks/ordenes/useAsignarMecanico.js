import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { ordenesService } from '@/services/ordenesService'

// RPC asignar_mecanico(p_orden, p_mecanico)
export function useAsignarMecanico() {
  const m = useSupabaseMutation((ordenId, mecanicoId) => ordenesService.asignarMecanico(ordenId, mecanicoId))
  return { asignar: m.mutate, pending: m.pending, error: m.error }
}
