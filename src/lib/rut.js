// Mismas reglas que privado.normalizar_rut() y privado.rut_valido()

export function normalizarRut(rut) {
  if (!rut) return ''
  const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 2) return limpio
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`
}

export function rutValido(rut) {
  const r = normalizarRut(rut)
  if (!/^[0-9]{7,8}-[0-9K]$/.test(r)) return false
  const [cuerpo, dv] = r.split('-')
  let suma = 0
  let mult = 2
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const res = 11 - (suma % 11)
  const esperado = res === 11 ? '0' : res === 10 ? 'K' : String(res)
  return dv === esperado
}

// 11111111-1 → 11.111.111-1
export function formatearRut(rut) {
  const r = normalizarRut(rut)
  if (!r.includes('-')) return r
  const [cuerpo, dv] = r.split('-')
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}
