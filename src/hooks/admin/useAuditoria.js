import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { auditoriaService } from '@/services/auditoriaService'
import { usuariosService } from '@/services/usuariosService'

export function useAuditoria(filtros, { page = 0, pageSize = 25 } = {}) {
  const key = JSON.stringify(filtros)
  const q = useSupabaseQuery(
    () => auditoriaService.listar({ ...filtros, rango: [page * pageSize, page * pageSize + pageSize - 1] }),
    [key, page, pageSize],
    { initialData: [] },
  )
  return { ...q, filas: q.data ?? [], total: q.count }
}

// id → nombre de todo el personal (para auditoría e historial)
export function useNombresPersonal() {
  const q = useSupabaseQuery(() => usuariosService.mapaNombres(), [], { initialData: {} })
  return q.data ?? {}
}
