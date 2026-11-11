import EmptyState from '@/components/ui/EmptyState'
import { formatFechaHora } from '@/lib/format'

export default function AvancesList({ avances }) {
  if (!avances?.length) return <EmptyState mensaje="El mecánico aún no registra avances" compacto />
  return (
    <ul className="list">
      {avances.map((a) => (
        <li key={a.id} className="list__item">
          <div className="list__main">
            <span className="list__title">{a.nota}</span>
            <span className="muted small">
              {formatFechaHora(a.created_at)} · {a.perfiles?.nombre_completo}
            </span>
          </div>
          {a.porcentaje != null && <strong>{a.porcentaje}%</strong>}
        </li>
      ))}
    </ul>
  )
}
