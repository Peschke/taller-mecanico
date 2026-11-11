import { useNavigate } from 'react-router-dom'
import DataTable from '@/components/ui/DataTable'
import EstadoBadge from './EstadoBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatFecha, formatHoras } from '@/lib/format'

// Filas de v_panel_ordenes
export default function OrdenesTable({ ordenes, loading, error, onRetry, linkBase = '/admin/ordenes', emptyMessage, accion, columnasExtra = [] }) {
  const navigate = useNavigate()
  const columns = [
    { key: 'codigo', header: 'Código', render: (o) => <code className="code">{o.codigo}</code> },
    { key: 'patente', header: 'Patente', render: (o) => <strong>{o.patente}</strong> },
    { key: 'vehiculo', header: 'Vehículo', render: (o) => `${o.marca} ${o.modelo}` },
    { key: 'cliente', header: 'Cliente' },
    { key: 'estado', header: 'Estado', render: (o) => <EstadoBadge estado={o.estado} texto={o.estado_texto} /> },
    { key: 'mecanico', header: 'Mecánico', render: (o) => o.mecanico ?? <span className="muted">Sin asignar</span> },
    { key: 'avance', header: 'Avance', width: 140, render: (o) => <ProgressBar value={o.avance_pct} /> },
    { key: 'fecha_ingreso', header: 'Ingreso', render: (o) => formatFecha(o.fecha_ingreso) },
    { key: 'horas', header: 'En taller', align: 'right', render: (o) => formatHoras(o.horas_en_taller) },
    ...columnasExtra,
  ]
  if (accion) columns.push({ key: 'accion', header: '', align: 'right', render: (o) => <span onClick={(e) => e.stopPropagation()}>{accion(o)}</span> })

  return (
    <DataTable
      columns={columns}
      rows={ordenes}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyMessage={emptyMessage ?? 'No hay órdenes con estos filtros'}
      onRowClick={(o) => navigate(`${linkBase}/${o.id}`)}
    />
  )
}
