import { useAuth } from './useAuth'
import { ROLES } from '@/lib/constants/roles'
import { puede } from '@/lib/permisos'

export function useRole() {
  const { rol } = useAuth()
  return {
    rol,
    isAdmin: rol === ROLES.ADMIN,
    isRecepcion: rol === ROLES.RECEPCIONISTA,
    isMecanico: rol === ROLES.MECANICO,
    isCliente: rol === ROLES.CLIENTE,
    puede: (accion) => puede(rol, accion),
  }
}
