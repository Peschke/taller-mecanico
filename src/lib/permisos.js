// Espejo de la matriz RLS SOLO para decidir qué mostrar. La seguridad real está en la base.
import { ROLES } from './constants/roles'

const { ADMIN, RECEPCIONISTA, MECANICO, CLIENTE } = ROLES

const MATRIZ = {
  'usuarios.gestionar': [ADMIN],
  'clientes.editar': [ADMIN, RECEPCIONISTA],
  'ordenes.crear': [ADMIN, RECEPCIONISTA],
  'ordenes.asignar': [ADMIN, RECEPCIONISTA],
  'ordenes.cancelar': [ADMIN],
  'ordenes.editarIngreso': [ADMIN, RECEPCIONISTA],
  'ordenes.avance': [ADMIN, MECANICO],
  'diagnostico.registrar': [ADMIN, MECANICO],
  'repuestos.asignar': [ADMIN, MECANICO],
  'inventario.gestionar': [ADMIN],
  'inventario.verCostos': [ADMIN],
  'presupuesto.gestionar': [ADMIN],
  'presupuesto.responder': [CLIENTE, ADMIN],
  'pagos.registrar': [ADMIN],
  'notificaciones.cliente': [ADMIN, RECEPCIONISTA],
  'reportes.ver': [ADMIN],
  'auditoria.ver': [ADMIN],
}

export const puede = (rol, accion) => Boolean(rol && MATRIZ[accion]?.includes(rol))
