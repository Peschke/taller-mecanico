import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { inventarioService } from '@/services/inventarioService'

export function useCatalogoRepuestos({ texto, categoriaId, incluirInactivos, page = 0, pageSize = 25 } = {}) {
  const rango = [page * pageSize, page * pageSize + pageSize - 1]
  const q = useSupabaseQuery(
    () => inventarioService.listarRepuestos({ texto, categoriaId, incluirInactivos, rango }),
    [texto, categoriaId, incluirInactivos, page, pageSize],
    { initialData: [] },
  )
  return { ...q, repuestos: q.data ?? [], total: q.count }
}
