import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import ProgressBar from '@/components/ui/ProgressBar'
import Pagination from '@/components/ui/Pagination'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import EtapaStepper from '@/components/domain/ordenes/EtapaStepper'
import OrdenResumen from '@/components/domain/ordenes/OrdenResumen'
import HistorialEstadosTimeline from '@/components/domain/ordenes/HistorialEstadosTimeline'
import AvancesList from '@/components/domain/ordenes/AvancesList'
import TransicionButtons from '@/components/domain/ordenes/TransicionButtons'
import AsignarMecanicoModal from '@/components/domain/ordenes/AsignarMecanicoModal'
import FotoGallery from '@/components/domain/fotos/FotoGallery'
import PagosList from '@/components/domain/pagos/PagosList'
import SaldoCard from '@/components/domain/pagos/SaldoCard'
import AuditoriaDiff from '@/components/domain/auditoria/AuditoriaDiff'
import { useOrden, useDetalleTecnico } from '@/hooks/ordenes/useOrden'
import { useHistorialEstados } from '@/hooks/ordenes/useHistorialEstados'
import { useAvances } from '@/hooks/ordenes/useAvances'
import { useFotosOrden } from '@/hooks/ordenes/useFotosOrden'
import { usePresupuesto } from '@/hooks/finanzas/usePresupuesto'
import { useSaldo } from '@/hooks/finanzas/useSaldo'
import { usePagos } from '@/hooks/finanzas/usePagos'
import { useAuditoria, useNombresPersonal } from '@/hooks/admin/useAuditoria'
import { estaAbierta } from '@/lib/constants/estados'
import { ESTADOS_PRESUPUESTO } from '@/lib/constants/enums'
import { formatCLP, formatFechaHora } from '@/lib/format'

export default function OrdenAdminDetallePage() {
  const { ordenId } = useParams()
  const [tab, setTab] = useState('trabajo')
  const [asignar, setAsignar] = useState(false)
  const [audPage, setAudPage] = useState(0)

  const { orden, loading, error, refetch } = useOrden(ordenId)
  const tecnico = useDetalleTecnico(ordenId)
  const historial = useHistorialEstados(ordenId, [orden?.estado])
  const avances = useAvances(ordenId)
  const fotos = useFotosOrden(ordenId)
  const pres = usePresupuesto(ordenId)
  const saldo = useSaldo(ordenId)
  const pagos = usePagos(ordenId)
  const nombres = useNombresPersonal()
  const auditoria = useAuditoria({ ordenId }, { page: audPage, pageSize: 15 })

  if (loading && !orden) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!orden) return <EmptyState mensaje="Orden no encontrada" accion={<Button to="/admin/ordenes">Volver a órdenes</Button>} />

  const recargarTodo = () => {
    refetch({ silencioso: true })
    historial.refetch({ silencioso: true })
    pres.recargar()
    saldo.refetch({ silencioso: true })
  }
  const abierta = estaAbierta(orden.estado)

  return (
    <>
      <Breadcrumbs items={[{ label: 'Órdenes', to: '/admin/ordenes' }, { label: orden.codigo }]} />
      <PageHeader
        titulo={`${orden.vehiculos?.patente} · ${orden.codigo}`}
        acciones={
          <>
            {orden.estado === 'diagnosticado' && (
              <Button variant="primary" to={`/admin/ordenes/${orden.id}/presupuesto`}>
                Armar presupuesto
              </Button>
            )}
            {['listo_entrega', 'presupuesto_aprobado', 'en_reparacion', 'pruebas_ruta', 'trabajo_terminado', 'esperando_repuesto'].includes(orden.estado) && (
              <Button variant={orden.estado === 'listo_entrega' ? 'primary' : 'secondary'} to={`/admin/ordenes/${orden.id}/cobro`}>
                Cobro
              </Button>
            )}
            {abierta && <Button onClick={() => setAsignar(true)}>{orden.mecanico_id ? 'Reasignar mecánico' : 'Asignar mecánico'}</Button>}
          </>
        }
      >
        <div className="row-wrap">
          <EstadoBadge estado={orden.estado} />
          <span className="muted small">Seguimiento: {orden.codigo_seguimiento}</span>
        </div>
      </PageHeader>

      <Card className="section">
        <EtapaStepper estado={orden.estado} />
        <div className="row-wrap section-sm">
          <div className="grow">
            <ProgressBar value={orden.avance_pct} />
          </div>
          {abierta && <TransicionButtons orden={orden} onCambio={recargarTodo} size="sm" />}
        </div>
      </Card>

      <div className="section">
        <OrdenResumen orden={orden} />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'trabajo', label: 'Trabajo' },
          { value: 'presupuesto', label: 'Presupuesto y pagos' },
          { value: 'historial', label: 'Historial' },
          { value: 'fotos', label: 'Fotos', badge: fotos.data?.length || undefined },
          { value: 'auditoria', label: 'Auditoría' },
        ]}
      />

      {tab === 'trabajo' && (
        <div className="grid-2">
          <Card titulo="Diagnóstico y tareas">
            {!tecnico.data.diagnosticos.length ? (
              <EmptyState mensaje="Sin diagnóstico registrado" compacto />
            ) : (
              tecnico.data.diagnosticos.map((d) => (
                <div key={d.id} className="stack-sm">
                  <p>{d.descripcion}</p>
                  <p className="muted small">
                    {d.perfiles?.nombre_completo} · {formatFechaHora(d.created_at)}
                  </p>
                </div>
              ))
            )}
            {tecnico.data.tareas.length > 0 && (
              <ul className="checklist">
                {tecnico.data.tareas.map((t) => (
                  <li key={t.id} className={t.completada ? 'checklist__done' : undefined}>
                    <span aria-hidden="true">{t.completada ? '✓' : '○'}</span> {t.descripcion}
                  </li>
                ))}
              </ul>
            )}
            {orden.observaciones_finales && (
              <p className="small">
                <strong>Observaciones finales:</strong> {orden.observaciones_finales}
              </p>
            )}
          </Card>
          <Card titulo="Repuestos usados">
            {!tecnico.data.repuestos.length ? (
              <EmptyState mensaje="Sin repuestos asignados" compacto />
            ) : (
              <ul className="list">
                {tecnico.data.repuestos.map((r) => (
                  <li key={r.id} className="list__item">
                    <div className="list__main">
                      <span className="list__title">{r.repuestos?.nombre}</span>
                      <span className="muted small">
                        {r.repuestos?.codigo} · costo {formatCLP(r.costo_unitario)} · venta {formatCLP(r.precio_unitario)}
                      </span>
                    </div>
                    <strong>× {r.cantidad}</strong>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card titulo="Avances del mecánico" className="span-all">
            <AvancesList avances={avances.data} />
          </Card>
        </div>
      )}

      {tab === 'presupuesto' && (
        <div className="stack">
          <div className="grid-2">
            <Card titulo="Presupuestos" acciones={<Button size="sm" to={`/admin/ordenes/${orden.id}/presupuesto`}>Abrir editor</Button>}>
              {!pres.presupuestos.length ? (
                <EmptyState mensaje="Sin presupuestos" compacto />
              ) : (
                <ul className="list">
                  {pres.presupuestos.map((p) => (
                    <li key={p.id} className="list__item">
                      <div className="list__main">
                        <span className="list__title">
                          Versión {p.version} · {formatCLP(p.total)}
                        </span>
                        <span className="muted small">
                          {p.publicado_en ? `Publicado ${formatFechaHora(p.publicado_en)}` : 'Sin publicar'}
                          {p.motivo_rechazo ? ` · Rechazo: ${p.motivo_rechazo}` : ''}
                        </span>
                      </div>
                      <Badge tono={p.estado === 'aprobado' ? 'success' : p.estado === 'rechazado' ? 'danger' : p.estado === 'publicado' ? 'warning' : 'neutral'}>
                        {ESTADOS_PRESUPUESTO[p.estado]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <SaldoCard saldo={saldo.saldo} loading={saldo.loading} />
          </div>
          <Card titulo="Pagos" padding={false}>
            <PagosList pagos={pagos.pagos} loading={pagos.loading} />
          </Card>
        </div>
      )}

      {tab === 'historial' && (
        <Card titulo="Cambios de estado">
          <HistorialEstadosTimeline historial={historial.data} nombres={nombres} />
        </Card>
      )}

      {tab === 'fotos' && (
        <Card titulo="Fotos">
          <FotoGallery fotos={fotos.data} loading={fotos.loading} />
        </Card>
      )}

      {tab === 'auditoria' && (
        <Card titulo="Auditoría de la orden" padding={false}>
          {!auditoria.filas.length && !auditoria.loading ? (
            <EmptyState mensaje="Sin registros" compacto />
          ) : (
            <ul className="list">
              {auditoria.filas.map((a) => (
                <li key={a.id} className="list__item list__item--block">
                  <div className="row-wrap">
                    <Badge tono={a.accion === 'DELETE' ? 'danger' : a.accion === 'INSERT' ? 'success' : 'info'}>{a.accion}</Badge>
                    <code className="code">{a.tabla}</code>
                    <span className="muted small">
                      {formatFechaHora(a.created_at)} · {nombres[a.usuario_id] ?? a.rol}
                    </span>
                  </div>
                  <AuditoriaDiff antes={a.datos_antes} despues={a.datos_despues} />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={audPage} pageSize={15} total={auditoria.total} onChange={setAudPage} />
        </Card>
      )}

      <AsignarMecanicoModal open={asignar} orden={orden} onClose={() => setAsignar(false)} onAsignado={recargarTodo} />
    </>
  )
}
