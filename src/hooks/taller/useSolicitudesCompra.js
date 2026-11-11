import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { solicitudesService } from '@/services/solicitudesService'

export function useSolicitudesCompra(filtros = {}) {
  const key = JSON.stringify(filtros)
  const q = useSupabaseQuery(() => solicitudesService.listar(filtros), [key], { initialData: [] })
  return { ...q, solicitudes: q.data ?? [] }
}
