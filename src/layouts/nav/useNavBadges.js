import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { ROLES } from '@/lib/constants/roles'

const contar = async (tabla, col, valor) => {
  const { count } = await supabase.from(tabla).select('id', { count: 'exact', head: true }).eq(col, valor)
  return count ?? 0
}

// Contadores del menú. Se refrescan con cada cambio en ordenes_trabajo y cada 60 s.
export function useNavBadges(rol) {
  const [badges, setBadges] = useState({})
  const timer = useRef(null)

  const cargar = useCallback(async () => {
    if (rol === ROLES.ADMIN) {
      const [presupuestos, compras, porNotificar] = await Promise.all([
        contar('v_panel_ordenes', 'estado', 'diagnosticado'),
        contar('solicitudes_compra', 'estado', 'pendiente'),
        contar('v_panel_ordenes', 'estado', 'trabajo_terminado'),
      ])
      setBadges({ presupuestos, compras, porNotificar })
    } else if (rol === ROLES.RECEPCIONISTA) {
      setBadges({ porNotificar: await contar('v_panel_ordenes', 'estado', 'trabajo_terminado') })
    }
  }, [rol])

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, 60_000)
    return () => clearInterval(id)
  }, [cargar])

  useRealtimeTable({
    table: 'ordenes_trabajo',
    enabled: rol === ROLES.ADMIN || rol === ROLES.RECEPCIONISTA,
    onChange: () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(cargar, 800)
    },
  })

  return badges
}
