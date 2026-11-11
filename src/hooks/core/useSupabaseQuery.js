import { useCallback, useEffect, useRef, useState } from 'react'
import { traducirError } from '@/lib/errors'

/**
 * Ejecuta una consulta de servicio y expone { data, error, loading, refetch }.
 * queryFn puede devolver la respuesta de Supabase ({ data, error, count }) o un valor plano.
 */
export function useSupabaseQuery(queryFn, deps = [], { enabled = true, initialData = null, keepPrevious = true } = {}) {
  const [data, setData] = useState(initialData)
  const [count, setCount] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const reqId = useRef(0)
  const fnRef = useRef(queryFn)
  fnRef.current = queryFn

  const ejecutar = useCallback(
    async ({ silencioso = false } = {}) => {
      reqId.current += 1
      const id = reqId.current
      if (!silencioso) setLoading(true)
      if (!keepPrevious) setData(initialData)
      try {
        const res = await fnRef.current()
        if (id !== reqId.current) return
        if (res && typeof res === 'object' && 'error' in res) {
          if (res.error) throw res.error
          setData(res.data)
          setCount(res.count ?? null)
        } else {
          setData(res)
        }
        setError(null)
      } catch (e) {
        if (id !== reqId.current) return
        setError(traducirError(e))
      } finally {
        if (id === reqId.current) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keepPrevious],
  )

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return undefined
    }
    ejecutar()
    return () => {
      reqId.current += 1
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  const refetch = useCallback((opts) => ejecutar(opts), [ejecutar])

  return { data, count, error, loading, refetch, setData }
}
