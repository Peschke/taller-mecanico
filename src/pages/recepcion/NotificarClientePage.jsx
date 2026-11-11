import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import NotificarClientePanel from '@/components/domain/notificaciones/NotificarClientePanel'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useAuth } from '@/hooks/core/useAuth'
import { recepcionService } from '@/services/recepcionService'
import { rutaOrden } from '@/routes/paths'

// CU-03 en pantalla completa (enlace directo desde el panel o una notificación interna)
export default function NotificarClientePage() {
  const { ordenId } = useParams()
  const base = useBasePath()
  const { rol } = useAuth()
  const navigate = useNavigate()
  const { data: orden, loading, error, refetch } = useSupabaseQuery(() => recepcionService.ordenParaNotificar(ordenId), [ordenId], {
    enabled: Boolean(ordenId),
  })

  if (loading && !orden) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!orden) return <EmptyState mensaje="Orden no encontrada" accion={<Button to={`${base}/por-notificar`}>Volver</Button>} />

  return (
    <>
      <Breadcrumbs items={[{ label: 'Por notificar', to: `${base}/por-notificar` }, { label: orden.codigo }]} />
      <PageHeader
        titulo={`Notificar · ${orden.vehiculos?.patente}`}
        subtitulo={`${orden.clientes?.nombre} · ${orden.codigo}`}
        acciones={<Button to={rutaOrden(rol, orden.id)}>Ver orden</Button>}
      >
        <EstadoBadge estado={orden.estado} />
      </PageHeader>
      <Card>
        {orden.estado === 'trabajo_terminado' ? (
          <NotificarClientePanel orden={orden} base={base} onNotificado={() => navigate(`${base}/por-notificar`)} />
        ) : (
          <EmptyState
            mensaje="Esta orden no está en Trabajo terminado"
            detalle="Solo se avisa al cliente cuando el mecánico marca el trabajo como terminado."
            accion={<Button to={rutaOrden(rol, orden.id)}>Ir a la orden</Button>}
          />
        )}
      </Card>
    </>
  )
}
