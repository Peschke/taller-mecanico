// Espejo del enum public.estado_orden y de las funciones etiqueta_estado() / etapa_rnf03()

export const ETAPAS = ['Ingresado', 'Diagnóstico', 'Esperando repuesto', 'En reparación', 'Listo', 'Entregado']

export const ESTADOS = {
  por_asignar: { etiqueta: 'Por Asignar', etapa: 'Ingresado', tono: 'neutral' },
  por_diagnosticar: { etiqueta: 'Por Diagnosticar', etapa: 'Diagnóstico', tono: 'info' },
  diagnosticado: { etiqueta: 'Diagnosticado / Esperando Presupuesto', etapa: 'Diagnóstico', tono: 'info' },
  esperando_aprobacion: { etiqueta: 'Esperando Aprobación de Cliente', etapa: 'Diagnóstico', tono: 'warning' },
  presupuesto_aprobado: { etiqueta: 'Presupuesto Aprobado', etapa: 'En reparación', tono: 'info' },
  presupuesto_rechazado: { etiqueta: 'Presupuesto Rechazado', etapa: 'Diagnóstico', tono: 'danger' },
  esperando_repuesto: { etiqueta: 'Esperando Repuesto', etapa: 'Esperando repuesto', tono: 'warning' },
  en_reparacion: { etiqueta: 'En Reparación', etapa: 'En reparación', tono: 'info' },
  pruebas_ruta: { etiqueta: 'Pruebas de Ruta', etapa: 'En reparación', tono: 'info' },
  trabajo_terminado: { etiqueta: 'Trabajo Terminado', etapa: 'Listo', tono: 'success' },
  listo_entrega: { etiqueta: 'Listo para Entrega', etapa: 'Listo', tono: 'success' },
  pagado_cerrado: { etiqueta: 'Pagado y Cerrado', etapa: 'Entregado', tono: 'neutral' },
  cancelada: { etiqueta: 'Cancelada', etapa: 'Cancelada', tono: 'neutral' },
}

export const ESTADOS_CERRADOS = ['pagado_cerrado', 'cancelada']

export const etiquetaEstado = (estado) => ESTADOS[estado]?.etiqueta ?? estado
export const etapaEstado = (estado) => ESTADOS[estado]?.etapa ?? '—'
export const tonoEstado = (estado) => ESTADOS[estado]?.tono ?? 'neutral'
export const estaAbierta = (estado) => !ESTADOS_CERRADOS.includes(estado)
