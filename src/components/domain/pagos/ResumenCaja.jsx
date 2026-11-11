import { formatCLP } from '@/lib/format'
import { METODOS_PAGO } from '@/lib/constants/enums'

// Totales del día por método, sin pagos anulados
export default function ResumenCaja({ pagos }) {
  const validos = pagos.filter((p) => !p.anulado)
  const porMetodo = METODOS_PAGO.map((m) => ({
    ...m,
    cantidad: validos.filter((p) => p.metodo === m.value).length,
    total: validos.filter((p) => p.metodo === m.value).reduce((s, p) => s + Number(p.monto), 0),
  }))
  const total = porMetodo.reduce((s, m) => s + m.total, 0)
  const anulados = pagos.filter((p) => p.anulado)

  return (
    <div className="stack">
      <div className="grid-kpi">
        {porMetodo.map((m) => (
          <div key={m.value} className="card kpi">
            <div className="kpi__label">{m.label}</div>
            <div className="kpi__value">{formatCLP(m.total)}</div>
            <div className="kpi__detail">
              {m.cantidad} pago{m.cantidad === 1 ? '' : 's'}
            </div>
          </div>
        ))}
        <div className="card kpi kpi--accent">
          <div className="kpi__label">Total del día</div>
          <div className="kpi__value">{formatCLP(total)}</div>
          <div className="kpi__detail">{anulados.length ? `${anulados.length} anulado(s) excluido(s)` : 'Sin anulaciones'}</div>
        </div>
      </div>
    </div>
  )
}
