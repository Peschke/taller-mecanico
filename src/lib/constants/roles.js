export const ROLES = {
  ADMIN: 'admin',
  RECEPCIONISTA: 'recepcionista',
  MECANICO: 'mecanico',
  CLIENTE: 'cliente',
}

export const ROLES_STAFF = [ROLES.ADMIN, ROLES.RECEPCIONISTA, ROLES.MECANICO]

export const HOME_POR_ROL = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.RECEPCIONISTA]: '/recepcion',
  [ROLES.MECANICO]: '/taller',
  [ROLES.CLIENTE]: '/cliente',
}

export const ETIQUETA_ROL = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.RECEPCIONISTA]: 'Recepción',
  [ROLES.MECANICO]: 'Mecánico',
  [ROLES.CLIENTE]: 'Cliente',
}
