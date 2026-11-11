import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { inventarioService } from '@/services/inventarioService'

export function useKardex(repuestoId, { page = 0, pageSize = 20 } = {}) {
  const repuesto = useSupabaseQuery(() => inventarioService.obtenerRepuesto(repuestoId), [repuestoId], {
    enabled: Boolean(repuestoId),
  })
  const movimientos = useSupabaseQuery(
    () => inventarioService.movimientos(repuestoId, [page * pageSize, page * pageSize + pageSize - 1]),
    [repuestoId, page, pageSize],
    { enabled: Boolean(repuestoId), initialData: [] },
  )
  const registrar = useSupabaseMutation((mov) => inventarioService.registrarMovimiento({ ...mov, repuesto_id: repuestoId }))

  const registrarMovimiento = async (mov) => {
    const r = await registrar.mutate(mov)
    if (r.ok) {
      repuesto.refetch({ silencioso: true })
      movimientos.refetch({ silencioso: true })
    }
    return r
  }

  return { repuesto, movimientos, registrarMovimiento, pending: registrar.pending }
}
