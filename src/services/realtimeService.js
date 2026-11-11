import { supabase } from '@/lib/supabaseClient'

let contador = 0

/**
 * Suscribe a cambios de una tabla publicada en supabase_realtime.
 * Realtime respeta RLS: solo llegan eventos de filas que el usuario puede leer.
 * @returns función para cerrar el canal
 */
export function suscribirTabla({ table, event = '*', filter, onChange, onStatus }) {
  contador += 1
  const nombre = `rt-${table}-${filter ?? 'all'}-${contador}`
  const config = { event, schema: 'public', table }
  if (filter) config.filter = filter

  const channel = supabase
    .channel(nombre)
    .on('postgres_changes', config, (payload) => onChange?.(payload))
    .subscribe((status) => onStatus?.(status))

  return () => {
    supabase.removeChannel(channel)
  }
}
