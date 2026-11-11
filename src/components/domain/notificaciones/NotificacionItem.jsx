import Badge from '@/components/ui/Badge'
import { formatFechaHora } from '@/lib/format'
import { CANALES_NOTIFICACION, labelDe } from '@/lib/constants/enums'

const TONO = { enviada: 'success', pendiente: 'warning', fallida: 'danger' }
const TEXTO = { enviada: 'Enviada', pendiente: 'Pendiente', fallida: 'Fallida' }

// Una fila del historial de avisos al cliente
export default function NotificacionItem({ n }) {
  return (
    <li className="list__item">
      <div className="list__main">
        <span className="list__title">{labelDe(CANALES_NOTIFICACION, n.canal)}</span>
        <span className="muted small">{formatFechaHora(n.enviada_en ?? n.created_at)}</span>
        {n.error_detalle && <span className="text-danger small">{n.error_detalle}</span>}
      </div>
      <Badge tono={TONO[n.estado]}>{TEXTO[n.estado]}</Badge>
    </li>
  )
}
