import { rutValido } from './rut'
import { patenteValida } from './patente'

export const correoValido = (c) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(c ?? '').trim())

// Teléfono chileno: 8 a 12 dígitos (con o sin +56)
export const telefonoValido = (t) => {
  const d = String(t ?? '').replace(/\D/g, '')
  return d.length >= 8 && d.length <= 12
}

// VIN: 17 caracteres, sin I, O ni Q
export const vinValido = (v) => /^[A-HJ-NPR-Z0-9]{17}$/.test(String(v ?? '').trim().toUpperCase())

const ANIO_MAX = new Date().getFullYear() + 1

export function validarCliente(c, { conRut = true } = {}) {
  const e = {}
  if (conRut) {
    if (!c.rut?.trim()) e.rut = 'Ingresa el RUT.'
    else if (!rutValido(c.rut)) e.rut = 'RUT inválido: revisa el dígito verificador.'
  }
  if (!c.nombre?.trim()) e.nombre = 'Ingresa el nombre del cliente.'
  if (!c.telefono?.trim()) e.telefono = 'Ingresa un teléfono de contacto.'
  else if (!telefonoValido(c.telefono)) e.telefono = 'Teléfono inválido (ej: +56 9 1234 5678).'
  if (c.correo?.trim() && !correoValido(c.correo)) e.correo = 'Correo inválido (ej: nombre@dominio.cl).'
  return e
}

export function validarVehiculo(v, { conPatente = true } = {}) {
  const e = {}
  if (conPatente) {
    if (!v.patente?.trim()) e.patente = 'Ingresa la patente.'
    else if (!patenteValida(v.patente)) e.patente = 'Patente inválida: 5 a 8 letras y números (ej: ABCD12).'
  }
  if (!v.marca?.trim()) e.marca = 'Ingresa la marca.'
  if (!v.modelo?.trim()) e.modelo = 'Ingresa el modelo.'
  const anio = Number(v.anio)
  if (!v.anio) e.anio = 'Ingresa el año.'
  else if (!Number.isInteger(anio) || anio < 1950 || anio > ANIO_MAX) e.anio = `Año entre 1950 y ${ANIO_MAX}.`
  if (v.vin?.trim() && !vinValido(v.vin)) e.vin = 'El VIN tiene 17 caracteres, sin I, O ni Q.'
  return e
}

export function validarOrden(o) {
  const e = {}
  const km = Number(String(o.kilometraje ?? '').replace(/\D/g, ''))
  if (o.kilometraje === '' || o.kilometraje == null) e.kilometraje = 'Ingresa el kilometraje.'
  else if (!Number.isInteger(km) || km < 0) e.kilometraje = 'Kilometraje inválido.'
  if (!o.nivel_combustible) e.nivel_combustible = 'Selecciona el nivel de combustible.'
  if (!o.motivo_ingreso?.trim()) e.motivo_ingreso = 'Describe el problema reportado por el cliente.'
  return e
}

export const sinErrores = (e) => Object.keys(e).length === 0
