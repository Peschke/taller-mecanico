// Exportación sin dependencias: CSV compatible con Excel (BOM + ';') e impresión a PDF del navegador

const escapar = (v) => {
  if (v == null) return ''
  const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v)
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * columns: [{ key, header, value?: (row) => any }]
 */
export function descargarCSV(nombreArchivo, columns, rows) {
  const cabecera = columns.map((c) => escapar(c.header)).join(';')
  const cuerpo = rows.map((r) => columns.map((c) => escapar(c.value ? c.value(r) : r[c.key])).join(';')).join('\n')
  const blob = new Blob([`﻿${cabecera}\n${cuerpo}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Usa los estilos @media print de global.css (oculta menús y botones)
export function imprimirPDF(titulo) {
  const anterior = document.title
  if (titulo) document.title = titulo
  window.print()
  document.title = anterior
}
