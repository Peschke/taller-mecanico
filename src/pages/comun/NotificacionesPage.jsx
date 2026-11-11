import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificaciones } from '@/hooks/comunicacion/useNotificaciones'
import { useAuth } from '@/hooks/core/useAuth'
import PageHeader from '@/components/layout/PageHeader'
import Tabs from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { formatFechaHora } from '@/lib/format'
import { MENSAJES } from '@/lib/constants/mensajes'
import { rutaOrden } from '@/routes/paths'

export default function NotificacionesPage() {
  const { items, unreadCount, loading, markAsRead, markAllAsRead } = useNotificaciones()
  const { rol } = useAuth()
  const [filtro, setFiltro] = useState('no_leidas')
  const navigate = useNavigate()

  const lista = filtro === 'no_leidas' ? items.filter((n) => !n.leida_en) : items

  return (
    <>
      <PageHeader
        titulo="Notificaciones"
        acciones={
          unreadCount > 0 && (
            <Button onClick={markAllAsRead} size="sm">
              Marcar todas como leídas
            </Button>
          )
        }
      />
      <Tabs
        value={filtro}
        onChange={setFiltro}
        tabs={[
          { value: 'no_leidas', label: 'No leídas', badge: unreadCount },
          { value: 'todas', label: 'Todas' },
        ]}
      />
      <div className="card card--flush">
        {loading && (
          <div className="stack pad">
            <Skeleton height={18} />
            <Skeleton height={18} />
          </div>
        )}
        {!loading && lista.length === 0 && <EmptyState mensaje={MENSAJES.SIN_NOTIFICACIONES} />}
        <ul className="list">
          {lista.map((n) => (
            <li key={n.id} className={['list__item', !n.leida_en && 'list__item--unread'].filter(Boolean).join(' ')}>
              <div className="list__main">
                <span className="list__title">{n.mensaje}</span>
                <span className="muted small">{formatFechaHora(n.created_at)}</span>
              </div>
              <div className="row-wrap">
                {n.orden_id && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!n.leida_en) markAsRead(n.id)
                      navigate(rutaOrden(rol, n.orden_id))
                    }}
                  >
                    Ver orden
                  </Button>
                )}
                {!n.leida_en && (
                  <Button size="sm" variant="ghost" onClick={() => markAsRead(n.id)}>
                    Marcar leída
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
