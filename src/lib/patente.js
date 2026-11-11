// Mismas reglas que privado.normalizar_patente() y el CHECK de vehiculos.patente

export const normalizarPatente = (p) => String(p ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()

export const patenteValida = (p) => /^[A-Z0-9]{5,8}$/.test(normalizarPatente(p))
