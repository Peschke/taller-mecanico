import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { pagosService } from '@/services/pagosService'

export function usePagos(ordenId, { onCambio } = {}) {
  const lista = useSupabaseQuery(() => pagosService.listarPorOrden(ordenId), [ordenId], { enabled: Boolean(ordenId), initialData: [] })
  const reg = useSupabaseMutation((pago) => pagosService.registrar({ ...pago, orden_id: ordenId }))
  const anu = useSupabaseMutation((id, motivo) => pagosService.anular(id, motivo))

  const despues = async (r) => {
    if (r.ok) {
      await lista.refetch({ silencioso: true })
      onCambio?.()
    }
    return r
  }

  return {
    pagos: lista.data ?? [],
    loading: lista.loading,
    error: lista.error,
    refetch: lista.refetch,
    registrar: async (pago) => despues(await reg.mutate(pago)),
    anular: async (id, motivo) => despues(await anu.mutate(id, motivo)),
    pending: reg.pending || anu.pending,
  }
}
