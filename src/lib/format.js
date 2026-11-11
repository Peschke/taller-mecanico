const TZ = 'America/Santiago'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const entero = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })
const fecha = new Intl.DateTimeFormat('es-CL', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' })
const fechaHora = new Intl.DateTimeFormat('es-CL', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const mes = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', month: 'long', year: 'numeric' })

export const formatCLP = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : clp.format(Number(n)))
export const formatNumero = (n) => (n == null ? '—' : entero.format(Number(n)))
export const formatKm = (n) => (n == null ? '—' : `${entero.format(Number(n))} km`)
export const formatFecha = (v) => (v ? fecha.format(new Date(v)) : '—')
export const formatFechaHora = (v) => (v ? fechaHora.format(new Date(v)) : '—')
// "2026-11-01" (columna mes de las vistas) → "noviembre de 2026"
export const formatMes = (v) => (v ? mes.format(new Date(`${String(v).slice(0, 10)}T00:00:00Z`)) : '—')

export function formatRelativo(v) {
  if (!v) return '—'
  const seg = Math.round((Date.now() - new Date(v).getTime()) / 1000)
  if (seg < 60) return 'hace un momento'
  const min = Math.round(seg / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  return `hace ${d} día${d === 1 ? '' : 's'}`
}

export const formatHoras = (h) => (h == null ? '—' : `${entero.format(Number(h))} h`)
