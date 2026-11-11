import Skeleton from './Skeleton'

export default function KpiCard({ label, value, detalle, loading }) {
  return (
    <div className="card kpi">
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{loading ? <Skeleton height={28} width="70%" /> : value}</div>
      {detalle && <div className="kpi__detail">{loading ? <Skeleton height={12} width="50%" /> : detalle}</div>}
    </div>
  )
}
