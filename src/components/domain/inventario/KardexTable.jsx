import { Link } from 'react-router-dom'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import { TIPOS_MOVIMIENTO } from '@/lib/constants/enums'
import { formatCLP, formatFechaHora } from '@/lib/format'

const SALIDAS = ['salida_orden', 'ajuste_negativo']

export default function KardexTable({ movimientos, loading, error, onRetry }) {
  return (
    <DataTable
      loading={loading}
      error={error}
      onRetry={onRetry}
      rows={movimientos}
      emptyMessage="Sin movimientos"
      columns={[
        { key: 'fecha', header: 'Fecha', render: (m) => formatFechaHora(m.created_at) },
        {
          key: 'tipo',
          header: 'Tipo',
          render: (m) => <Badge tono={SALIDAS.includes(m.tipo) ? 'warning' : m.tipo === 'entrada' ? 'success' : 'neutral'}>{TIPOS_MOVIMIENTO[m.tipo]}</Badge>,
        },
        {
          key: 'cantidad',
          header: 'Cantidad',
          align: 'right',
          render: (m) => <strong>{SALIDAS.includes(m.tipo) ? `−${m.cantidad}` : `+${m.cantidad}`}</strong>,
        },
        { key: 'costo', header: 'Costo unit.', align: 'right', render: (m) => formatCLP(m.costo_unitario) },
        { key: 'stock', header: 'Stock result.', align: 'right', render: (m) => m.stock_resultante },
        { key: 'cprom', header: 'Costo prom.', align: 'right', render: (m) => formatCLP(m.costo_promedio_resultante) },
        {
          key: 'orden',
          header: 'Orden',
          render: (m) => (m.ordenes_trabajo ? <Link to={`/admin/ordenes/${m.ordenes_trabajo.id}`}>{m.ordenes_trabajo.codigo}</Link> : '—'),
        },
        { key: 'motivo', header: 'Motivo', render: (m) => m.motivo ?? '—' },
        { key: 'usuario', header: 'Usuario', render: (m) => m.perfiles?.nombre_completo ?? 'Sistema' },
      ]}
    />
  )
}
