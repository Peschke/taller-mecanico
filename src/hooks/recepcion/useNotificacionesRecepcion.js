import { useRef } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { recepcionService } from '@/services/recepcionService'
import { notificacionesService } from '@/services/notificacionesService'

// CU-03: órdenes en Trabajo Terminado, en vivo
export function usePorNotificar() {
  const q = useSupabaseQuery(() => recepcionService.porNotificar(), [], { initialData: [] })
  const timer = useRef(null)
  useRealtimeTable({
    table: 'ordenes_trabajo',
    onChange: () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => q.refetch({ silencioso: true }), 500)
    },
  })
  return { ...q, ordenes: q.data ?? [] }
}

// Avisos ya enviados al cliente para una orden
export function useAvisosCliente(ordenId, deps = []) {
  return useSupabaseQuery(() => notificacionesService.avisosCliente(ordenId), [ordenId, ...deps], { enabled: Boolean(ordenId), initialData: [] })
}

/**
 * Acciones de aviso al cliente:
 * - correo (RF08): Edge Function notificar-cliente
 * - whatsapp / llamada (RF09): se registra como enviada; el trigger pasa la orden a listo_entrega
 */
export function useNotificacionesRecepcion() {
  const correo = useSupabaseMutation((datos) => notificacionesService.enviarCorreo(datos))
  const manual = useSupabaseMutation((datos) => notificacionesService.registrarAvisoManual(datos))
  return {
    enviarCorreo: correo.mutate,
    registrarAvisoManual: manual.mutate,
    pending: correo.pending || manual.pending,
  }
}
