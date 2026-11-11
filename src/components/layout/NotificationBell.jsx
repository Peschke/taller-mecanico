import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useClickOutside } from './useClickOutside'
import { useNotificaciones } from '@/hooks/comunicacion/useNotificaciones'
import { useAuth } from '@/hooks/core/useAuth'
import { rutaNotificaciones, rutaOrden } from '@/routes/paths'
import { formatRelativo } from '@/lib/format'

export default function NotificationBell() {
  const { items, unreadCount, markAsRead, markAllAsRead, enabled } = useNotificaciones()
  const { rol } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const cerrar = useCallback(() => setOpen(false), [])
  useClickOutside(ref, cerrar, open)

  if (!enabled) return null
  const recientes = items.slice(0, 6)

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="icon-btn bell"
        aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="campana" />
        {unreadCount > 0 && <span className="bell__count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="dropdown__panel dropdown__panel--wide" role="dialog" aria-label="Notificaciones">
          <div className="dropdown__head">
            <strong>Notificaciones</strong>
            {unreadCount > 0 && (
              <button type="button" className="link-btn" onClick={markAllAsRead}>
                Marcar todas como leídas
              </button>
            )}
          </div>
          {recientes.length === 0 && <p className="muted dropdown__empty">No tienes notificaciones</p>}
          <ul className="notif-list">
            {recientes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={['notif-item', !n.leida_en && 'notif-item--unread'].filter(Boolean).join(' ')}
                  onClick={() => {
                    markAsRead(n.id)
                    setOpen(false)
                    if (n.orden_id) navigate(rutaOrden(rol, n.orden_id))
                  }}
                >
                  <span className="notif-item__msg">{n.mensaje}</span>
                  <span className="notif-item__time">{formatRelativo(n.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link to={rutaNotificaciones(rol)} className="dropdown__foot" onClick={cerrar}>
            Ver todas
          </Link>
        </div>
      )}
    </div>
  )
}
