import { useAuth } from './useAuth'
import { ROLES } from '@/lib/constants/roles'

// Las pantallas de recepción se montan también bajo /admin
export function useBasePath() {
  const { rol } = useAuth()
  return rol === ROLES.ADMIN ? '/admin' : '/recepcion'
}
