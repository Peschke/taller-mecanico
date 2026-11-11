// Espejo de los enums de PostgreSQL

export const NIVELES_COMBUSTIBLE = [
  { value: 'reserva', label: 'Reserva' },
  { value: '1/4', label: '1/4' },
  { value: '1/2', label: '1/2' },
  { value: '3/4', label: '3/4' },
  { value: 'lleno', label: 'Lleno' },
]

export const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_debito', label: 'Tarjeta de débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta de crédito' },
  { value: 'transferencia', label: 'Transferencia' },
]

export const CANALES_NOTIFICACION = [
  { value: 'email', label: 'Correo' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'llamada', label: 'Llamada telefónica' },
]

export const TIPOS_FOTO = [
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'entrega', label: 'Entrega' },
]

export const TIPOS_MOVIMIENTO = {
  inicial: 'Stock inicial',
  entrada: 'Entrada',
  salida_orden: 'Salida a orden',
  devolucion_orden: 'Devolución de orden',
  ajuste_positivo: 'Ajuste (+)',
  ajuste_negativo: 'Ajuste (−)',
}

export const ESTADOS_SOLICITUD = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  comprada: 'Comprada',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

export const ESTADOS_PRESUPUESTO = {
  borrador: 'Borrador',
  publicado: 'Publicado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  anulado: 'Anulado',
}

export const labelDe = (lista, value) => lista.find((x) => x.value === value)?.label ?? value
