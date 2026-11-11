import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import NotificarClienteModal from '@/components/domain/notificaciones/NotificarClienteModal'
import { usePorNotificar } from '@/hooks/recepcion/useNotificacionesRecepcion'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useAuth } from '@/hooks/core/useAuth'
import { formatFechaHora, formatRelativo } from '@/lib/format'
import { rutaOrden } from '@/routes/paths'

// CU-03 · RF08, RF09: vehículos en Trabajo Terminado esperando aviso al cliente
export default function PorNotificarPage() {
  const base = useBasePath()
  const { rol } = useAuth()
  const navigate = useNavigate()
  const { ordenes, loading, error, refetch } = usePorNotificar()
  const [sel, setSel] = useState(null) // { orden, canal }

  return (
    <>
      <PageHeader
        titulo="Por notificar"
        subtitulo="Al registrar el aviso, la orden pasa automáticamente a Listo para entrega."
        acciones={<Badge tono={ordenes.length ? 'warning' : 'success'}>{ordenes.length} pendiente(s)</Badge>}
      />
      <Card padding={false}>
        <DataTable
          loading={loading}
          error={error}
          onRetry={refetch}
          rows={ordenes}
          emptyMessage="No hay vehículos terminados pendientes de aviso"
          onRowClick={(o) => navigate(rutaOrden(rol, o.id))}
          columns={[
            {
              key: 'cliente',
              header: 'Cliente',
              render: (o) => (
                <div className="cell-stack">
                  <strong>{o.clientes?.nombre}</strong>
                  {!o.clientes?.correo && <span className="muted small">Sin correo</span>}
                </div>
              ),
            },
            { key: 'tel', header: 'Teléfono', render: (o) => <a href={`tel:${o.clientes?.telefono}`} onClick={(e) => e.stopPropagation()}>{o.clientes?.telefono}</a> },
            { key: 'veh', header: 'Vehículo', render: (o) => `${o.vehiculos?.marca} ${o.vehiculos?.modelo}` },
            { key: 'pat', header: 'Patente', render: (o) => <strong className="patente">{o.vehiculos?.patente}</strong> },
            {
              key: 'fin',
              header: 'Fecha término',
              render: (o) => (
                <div className="cell-stack">
                  <span>{formatFechaHora(o.fecha_termino)}</span>
                  <span className="muted small">{formatRelativo(o.fecha_termino)}</span>
                </div>
              ),
            },
            {
              key: 'acc',
              header: 'Acciones',
              align: 'right',
              render: (o) => (
                <span className="row-wrap row-end" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="primary" disabled={!o.clientes?.correo} title={o.clientes?.correo ? undefined : 'El cliente no tiene correo'} onClick={() => setSel({ orden: o, canal: 'correo' })}>
                    Correo
                  </Button>
                  <Button size="sm" onClick={() => setSel({ orden: o, canal: 'whatsapp' })}>
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSel({ orden: o, canal: 'llamada' })}>
                    Registrar llamada
                  </Button>
                </span>
              ),
            },
          ]}
        />
      </Card>
      <NotificarClienteModal
        orden={sel?.orden ?? null}
        canalInicial={sel?.canal}
        base={base}
        onClose={() => setSel(null)}
        onNotificado={() => refetch({ silencioso: true })}
      />
    </>
  )
}
