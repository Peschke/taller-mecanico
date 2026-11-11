import Button from '@/components/ui/Button'
import { descargarCSV, imprimirPDF } from '@/lib/exportar'

// csvColumns: [{ key, header, value? }]
export default function ExportButtons({ nombre, csvColumns, rows, disabled }) {
  return (
    <div className="row-wrap no-print">
      <Button size="sm" disabled={disabled || !rows?.length} onClick={() => descargarCSV(nombre, csvColumns, rows)}>
        Exportar a Excel (CSV)
      </Button>
      <Button size="sm" disabled={disabled || !rows?.length} onClick={() => imprimirPDF(nombre)}>
        Exportar a PDF
      </Button>
    </div>
  )
}
