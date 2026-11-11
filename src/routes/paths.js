import { ROLES } from '@/lib/constants/roles'

export const PATHS = {
  landing: '/',
  login: '/login',
  accesoCliente: '/acceso-cliente',
  authCallback: '/auth/callback',
  recuperarClave: '/recuperar-clave',
  actualizarClave: '/actualizar-clave',
  sinAcceso: '/sin-acceso',
  seguimiento: '/seguimiento',
  seguimientoEstado: '/seguimiento/estado',
  seguimientoHistorial: '/seguimiento/historial',
  admin: '/admin',
  recepcion: '/recepcion',
  taller: '/taller',
  cliente: '/cliente',
}

// Ruta al detalle de una orden según el área del rol
export function rutaOrden(rol, ordenId) {
  switch (rol) {
    case ROLES.ADMIN:
      return `/admin/ordenes/${ordenId}`
    case ROLES.RECEPCIONISTA:
      return `/recepcion/ordenes/${ordenId}`
    case ROLES.MECANICO:
      return `/taller/ordenes/${ordenId}`
    case ROLES.CLIENTE:
      return `/cliente/ordenes/${ordenId}`
    default:
      return '/'
  }
}

export function rutaNotificaciones(rol) {
  if (rol === ROLES.ADMIN) return '/admin/notificaciones'
  if (rol === ROLES.RECEPCIONISTA) return '/recepcion/notificaciones'
  return '/taller/notificaciones'
}

export function rutaMiCuenta(rol) {
  if (rol === ROLES.ADMIN) return '/admin/mi-cuenta'
  if (rol === ROLES.RECEPCIONISTA) return '/recepcion/mi-cuenta'
  if (rol === ROLES.MECANICO) return '/taller/mi-cuenta'
  return '/cliente'
}
