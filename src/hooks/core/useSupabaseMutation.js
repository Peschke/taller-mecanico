import { useCallback, useRef, useState } from 'react'
import { traducirError } from '@/lib/errors'

/**
 * Envuelve una escritura. mutate(...args) → { ok, data, error } con el error ya traducido.
 */
export function useSupabaseMutation(mutationFn) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const fnRef = useRef(mutationFn)
  fnRef.current = mutationFn

  const mutate = useCallback(async (...args) => {
    setPending(true)
    setError(null)
    try {
      const res = await fnRef.current(...args)
      if (res && typeof res === 'object' && 'error' in res && res.error) throw res.error
      const data = res && typeof res === 'object' && 'data' in res ? res.data : res
      return { ok: true, data, error: null }
    } catch (e) {
      const msg = traducirError(e)
      setError(msg)
      return { ok: false, data: null, error: msg }
    } finally {
      setPending(false)
    }
  }, [])

  return { mutate, pending, error, resetError: () => setError(null) }
}
