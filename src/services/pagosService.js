import { supabase } from '@/lib/supabaseClient'

const COLS =
  'id, orden_id, presupuesto_id, monto, monto_recibido, metodo, numero_operacion, es_abono, anulado, motivo_anulacion, created_at, perfiles(nombre_completo)'

export const pagosService = {
  saldo: (ordenId) => supabase.from('v_saldo_ordenes').select('*').eq('orden_id', ordenId).maybeSingle(),

  // Órdenes con algo por cobrar: saldo > 0 o Listo para Entrega
  porCobrar: () =>
    supabase.from('v_saldo_ordenes').select('*').or('saldo.gt.0,estado.eq.listo_entrega').not('estado', 'in', '(pagado_cerrado,cancelada)'),

  listarPorOrden: (ordenId) => supabase.from('pagos').select(COLS).eq('orden_id', ordenId).order('created_at'),

  listarEntre: (desdeISO, hastaISO) =>
    supabase
      .from('pagos')
      .select(`${COLS}, ordenes_trabajo(codigo, vehiculos(patente))`)
      .gte('created_at', desdeISO)
      .lt('created_at', hastaISO)
      .order('created_at'),

  // Los triggers validan estado, saldo y cierran la orden si queda en cero (RF29, RF30)
  registrar: ({ orden_id, monto, monto_recibido, metodo, numero_operacion }) =>
    supabase
      .from('pagos')
      .insert({
        orden_id,
        monto,
        monto_recibido: metodo === 'efectivo' ? monto_recibido ?? monto : null,
        metodo,
        numero_operacion: metodo === 'efectivo' ? null : numero_operacion?.trim() || null,
      })
      .select(COLS)
      .single(),

  anular: (id, motivo) => supabase.from('pagos').update({ anulado: true, motivo_anulacion: motivo.trim() }).eq('id', id),
}
