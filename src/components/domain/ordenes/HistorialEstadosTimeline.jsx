import { etiquetaEstado } from '@/lib/constants/estados'
import { formatFechaHora } from '@/lib/format'
import { ETIQUETA_ROL } from '@/lib/constants/roles'
import EmptyState from '@/components/ui/EmptyState'

export default function HistorialEstadosTimeline({ historial, nombres = {} }) {
  if (!historial?.length) return <EmptyState mensaje="Sin cambios registrados" compacto />
  return (
    <ol className="timeline">
      {[...historial].reverse().map((h) => (
        <li key={h.id} className="timeline__item">
          <span className="timeline__dot" aria-hidden="true" />
          <div className="timeline__body">
            <div className="timeline__title">{etiquetaEstado(h.estado_nuevo)}</div>
            <div className="muted small">
              {formatFechaHora(h.created_at)} · {nombres[h.usuario_id] ?? ETIQUETA_ROL[h.actor_rol] ?? (h.actor_rol === 'sistema' ? 'Sistema' : h.actor_rol)}
            </div>
            {h.nota && <div className="small">{h.nota}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
