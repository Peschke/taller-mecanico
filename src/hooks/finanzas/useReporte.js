import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { reportesService } from '@/services/reportesService'

// tipo: 'financiero' | 'flujo' | 'consumo' | 'rendimiento'; desde/hasta: 'YYYY-MM'
export function useReporte(tipo, desde, hasta) {
  const q = useSupabaseQuery(
    () => (tipo === 'rendimiento' ? reportesService.rendimiento() : reportesService[tipo](desde, hasta)),
    [tipo, desde, hasta],
    { initialData: [], keepPrevious: false },
  )
  return { ...q, filas: q.data ?? [] }
}
