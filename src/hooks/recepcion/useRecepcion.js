import { useMemo } from 'react'
import { usePanelOrdenes } from '@/hooks/ordenes/usePanelOrdenes'
import { hoyISO, limitesDia } from '@/lib/fechas'
import { ETAPAS } from '@/lib/constants/estados'

// Datos del dashboard de recepción, en vivo (RNF02)
export function useRecepcion() {
  const abiertas = usePanelOrdenes({ excluirCerradas: true, orden: { col: 'fecha_ingreso', asc: true } })
  const desdeHoy = limitesDia(hoyISO()).desde
  const hoy = usePanelOrdenes({ desde: desdeHoy, orden: { col: 'fecha_ingreso', asc: false } }, { realtime: false })

  const datos = useMemo(() => {
    const os = abiertas.ordenes
    const porEtapa = Object.fromEntries(ETAPAS.slice(0, 5).map((e) => [e, os.filter((o) => o.etapa === e).length]))
    return {
      porAsignar: os.filter((o) => o.estado === 'por_asignar'),
      porNotificar: os.filter((o) => o.estado === 'trabajo_terminado'),
      listosEntrega: os.filter((o) => o.estado === 'listo_entrega'),
      enTaller: os.length,
      porEtapa,
    }
  }, [abiertas.ordenes])

  return {
    ...datos,
    ingresadosHoy: hoy.ordenes,
    loading: abiertas.loading,
    error: abiertas.error || hoy.error,
    realtimeStatus: abiertas.realtimeStatus,
    refetch: () => {
      abiertas.refetch({ silencioso: true })
      hoy.refetch({ silencioso: true })
    },
  }
}
