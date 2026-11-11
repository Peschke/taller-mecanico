import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatCLP, formatFechaHora } from '@/lib/format'
import { labelDe, METODOS_PAGO } from '@/lib/constants/enums'

export default function PagosList({ pagos, loading, onAnular }) {
  return (
    <DataTable
      loading={loading}
      rows={pagos}
      emptyMessage="Sin pagos registrados"
      columns={[
        { key: 'fecha', header: 'Fecha', render: (p) => formatFechaHora(p.created_at) },
        { key: 'metodo', header: 'Método', render: (p) => labelDe(METODOS_PAGO, p.metodo) },
        { key: 'operacion', header: 'N° operación', render: (p) => p.numero_operacion ?? '—' },
        {
          key: 'monto',
          header: 'Monto',
          align: 'right',
          render: (p) => <span className={p.anulado ? 'tachado' : undefined}>{formatCLP(p.monto)}</span>,
        },
        {
          key: 'tipo',
          header: 'Tipo',
          render: (p) =>
            p.anulado ? <Badge tono="danger">Anulado</Badge> : p.es_abono ? <Badge tono="warning">Abono</Badge> : <Badge tono="success">Pago</Badge>,
        },
        { key: 'usuario', header: 'Registró', render: (p) => p.perfiles?.nombre_completo ?? '—' },
        {
          key: 'acc',
          header: '',
          align: 'right',
          render: (p) =>
            !p.anulado && onAnular ? (
              <Button size="sm" variant="ghost" onClick={() => onAnular(p)}>
                Anular
              </Button>
            ) : p.anulado ? (
              <span className="muted small">{p.motivo_anulacion}</span>
            ) : null,
        },
      ]}
    />
  )
}
