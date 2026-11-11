// Cómo se presenta cada transición de estado como botón

export const ACCION_TRANSICION = {
  por_diagnosticar: { label: 'Volver a diagnóstico' },
  diagnosticado: { label: 'Volver a Diagnosticado (renegociar)' },
  en_reparacion: { label: 'Iniciar / continuar reparación', variant: 'primary' },
  pruebas_ruta: { label: 'Pasar a pruebas de ruta' },
  trabajo_terminado: { label: 'Finalizar trabajo', variant: 'primary', requiereNota: true, notaLabel: 'Observaciones finales' },
  listo_entrega: { label: 'Marcar listo para entrega', variant: 'primary' },
  pagado_cerrado: { label: 'Cerrar orden (saldo en cero)' },
  cancelada: { label: 'Cancelar orden', variant: 'danger', requiereNota: true, notaLabel: 'Motivo de la cancelación', peligro: true },
}

// Estas transiciones tienen su propia RPC o pantalla y no se ofrecen como botón genérico:
// por_asignar→por_diagnosticar (asignar_mecanico), →esperando_aprobacion (publicar_presupuesto),
// →presupuesto_aprobado / →presupuesto_rechazado (responder/registrar_respuesta_presupuesto)
export const DESTINOS_CON_FLUJO_PROPIO = ['esperando_aprobacion', 'presupuesto_aprobado', 'presupuesto_rechazado']

export function transicionesComoBotones(transiciones, estadoActual) {
  return transiciones
    .filter((t) => !DESTINOS_CON_FLUJO_PROPIO.includes(t.destino))
    .filter((t) => !(estadoActual === 'por_asignar' && t.destino === 'por_diagnosticar'))
    .filter((t) => ACCION_TRANSICION[t.destino])
    .map((t) => ({ destino: t.destino, ...ACCION_TRANSICION[t.destino] }))
}
