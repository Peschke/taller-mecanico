// Utilidades de fecha en la zona del usuario (America/Santiago)

const pad = (n) => String(n).padStart(2, '0')

// 'YYYY-MM' del mes actual
export function mesActual() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// Suma n meses a 'YYYY-MM'
export function sumarMeses(ym, n) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// 'YYYY-MM' → 'YYYY-MM-01' (formato de la columna mes de las vistas)
export const primerDia = (ym) => `${ym}-01`

// Lista de 'YYYY-MM' entre desde y hasta, inclusive
export function rangoMeses(desde, hasta) {
  const out = []
  let m = desde
  while (m <= hasta && out.length < 120) {
    out.push(m)
    m = sumarMeses(m, 1)
  }
  return out
}

// 'YYYY-MM-DD' de hoy (hora local)
export function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Límites [inicio, fin) de un día local como ISO UTC
export function limitesDia(fechaISO) {
  const [y, m, d] = fechaISO.split('-').map(Number)
  const inicio = new Date(y, m - 1, d)
  const fin = new Date(y, m - 1, d + 1)
  return { desde: inicio.toISOString(), hasta: fin.toISOString() }
}

export const mesCorto = (mes) => {
  const [y, m] = String(mes).slice(0, 7).split('-').map(Number)
  return new Intl.DateTimeFormat('es-CL', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)))
}
