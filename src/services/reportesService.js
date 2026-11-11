import { supabase } from '@/lib/supabaseClient'
import { primerDia } from '@/lib/fechas'

// Las 4 vistas devuelven filas solo al admin (filtro privado.rol_actual() = 'admin' dentro de la vista)
const porMes = (vista, desde, hasta) => {
  let q = supabase.from(vista).select('*')
  if (desde) q = q.gte('mes', primerDia(desde))
  if (hasta) q = q.lte('mes', primerDia(hasta))
  return q.order('mes')
}

export const reportesService = {
  financiero: (desde, hasta) => porMes('v_reporte_financiero_mensual', desde, hasta),
  flujo: (desde, hasta) => porMes('v_flujo_vehiculos', desde, hasta),
  consumo: (desde, hasta) => porMes('v_consumo_repuestos', desde, hasta).order('costo_total', { ascending: false }),
  rendimiento: () => supabase.from('v_rendimiento_mecanicos').select('*').order('ordenes_terminadas', { ascending: false }),
}
