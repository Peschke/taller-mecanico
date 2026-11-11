import { formatCLP } from '@/lib/format'

// Totales calculados por la base (columnas generadas total y margen, RF25)
export default function PresupuestoTotales({ p, mostrarCostos = true }) {
  if (!p) return null
  const subtotal = Number(p.total_repuestos) + Number(p.total_mano_obra) + Number(p.total_otros)
  const pct = Number(p.total) > 0 ? Math.round((Number(p.margen) / Number(p.total)) * 100) : 0
  return (
    <dl className="totales">
      <dt>Repuestos</dt>
      <dd>{formatCLP(p.total_repuestos)}</dd>
      <dt>Mano de obra</dt>
      <dd>{formatCLP(p.total_mano_obra)}</dd>
      {Number(p.total_otros) > 0 && (
        <>
          <dt>Otros</dt>
          <dd>{formatCLP(p.total_otros)}</dd>
        </>
      )}
      <dt>Subtotal</dt>
      <dd>{formatCLP(subtotal)}</dd>
      <dt>Descuento</dt>
      <dd>− {formatCLP(p.descuento)}</dd>
      <dt className="totales__total">Total cliente</dt>
      <dd className="totales__total">{formatCLP(p.total)}</dd>
      {mostrarCostos && (
        <>
          <dt className="totales__sep">Costo interno</dt>
          <dd className="totales__sep">{formatCLP(p.costo_interno)}</dd>
          <dt>Margen</dt>
          <dd className={Number(p.margen) < 0 ? 'text-danger' : 'text-success'}>
            {formatCLP(p.margen)} ({pct}%)
          </dd>
        </>
      )}
    </dl>
  )
}
