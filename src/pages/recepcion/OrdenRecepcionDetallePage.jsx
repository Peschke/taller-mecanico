import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import ProgressBar from '@/components/ui/ProgressBar'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import EtapaStepper from '@/components/domain/ordenes/EtapaStepper'
import OrdenResumen from '@/components/domain/ordenes/OrdenResumen'
import OrdenIngresoForm from '@/components/domain/ordenes/OrdenIngresoForm'
import OrdenTicket from '@/components/domain/ordenes/OrdenTicket'
import HistorialEstadosTimeline from '@/components/domain/ordenes/HistorialEstadosTimeline'
import AvancesList from '@/components/domain/ordenes/AvancesList'
import TransicionButtons from '@/components/domain/ordenes/TransicionButtons'
import AsignarMecanicoModal from '@/components/domain/ordenes/AsignarMecanicoModal'
import FotoGallery from '@/components/domain/fotos/FotoGallery'
import FotoUploader from '@/components/domain/fotos/FotoUploader'
import NotificarClienteModal from '@/components/domain/notificaciones/NotificarClienteModal'
import NotificacionItem from '@/components/domain/notificaciones/NotificacionItem'
import { useOrden, useDetalleTecnico } from '@/hooks/ordenes/useOrden'
import { useHistorialEstados } from '@/hooks/ordenes/useHistorialEstados'
import { useAvances } from '@/hooks/ordenes/useAvances'
import { useFotosOrden } from '@/hooks/ordenes/useFotosOrden'
import { useSubirFotos } from '@/hooks/ordenes/useSubirFotos'
import { usePresupuesto } from '@/hooks/finanzas/usePresupuesto'
import { useNombresPersonal } from '@/hooks/admin/useAuditoria'
import { useActualizarIngreso } from '@/hooks/recepcion/useOrdenesRecepcion'
import { useAvisosCliente } from '@/hooks/recepcion/useNotificacionesRecepcion'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useToast } from '@/hooks/core/useToast'
import { estaAbierta } from '@/lib/constants/estados'
import { ESTADOS_PRESUPUESTO, TIPOS_FOTO } from '@/lib/constants/enums'
import { formatCLP, formatFechaHora } from '@/lib/format'
import { imprimirPDF } from '@/lib/exportar'
import { sinErrores, validarOrden } from '@/lib/validaciones'

const EDITABLE_INGRESO = ['por_asignar', 'en_diagnostico']

// Orden vista por recepción: seguimiento, edición de ingreso, fotos y aviso al cliente
export default function OrdenRecepcionDetallePage() {
  const { ordenId } = useParams()
  const base = useBasePath()
  const toast = useToast()
  const [tab, setTab] = useState('resumen')
  const [asignar, setAsignar] = useState(false)
  const [notificar, setNotificar] = useState(null)
  const [editar, setEditar] = useState(null)
  const [errores, setErrores] = useState({})
  const [tipoFoto, setTipoFoto] = useState('ingreso')

  const { orden, loading, error, refetch } = useOrden(ordenId)
  const tecnico = useDetalleTecnico(ordenId)
  const historial = useHistorialEstados(ordenId, [orden?.estado])
  const avances = useAvances(ordenId)
  const fotos = useFotosOrden(ordenId)
  const pres = usePresupuesto(ordenId)
  const avisos = useAvisosCliente(ordenId, [orden?.estado])
  const nombres = useNombresPersonal()
  const subida = useSubirFotos()
  const { actualizarIngreso, pending: guardando } = useActualizarIngreso()

  if (loading && !orden) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!orden) return <EmptyState mensaje="Orden no encontrada" accion={<Button to={base}>Volver al panel</Button>} />

  const abierta = estaAbierta(orden.estado)
  const terminada = orden.estado === 'trabajo_terminado'
  const recargar = () => {
    refetch({ silencioso: true })
    historial.refetch({ silencioso: true })
    avisos.refetch({ silencioso: true })
  }

  const abrirEdicion = () => {
    setErrores({})
    setEditar({
      kilometraje: String(orden.kilometraje ?? ''),
      nivel_combustible: orden.nivel_combustible ?? '',
      motivo_ingreso: orden.motivo_ingreso ?? '',
      observaciones_ingreso: orden.observaciones_ingreso ?? '',
    })
  }

  const guardarIngreso = async () => {
    const err = validarOrden(editar)
    setErrores(err)
    if (!sinErrores(err)) return
    const r = await actualizarIngreso(orden.id, editar)
    if (!r.ok) return toast.error(r.error)
    toast.success('Datos de ingreso actualizados')
    setEditar(null)
    refetch({ silencioso: true })
  }

  const subirFotos = async () => {
    const r = await subida.subirTodas(orden.id, tipoFoto)
    if (r.ok) {
      toast.success('Fotos agregadas a la orden')
      subida.limpiar()
    } else toast.error(`${r.fallidas} foto(s) no se pudieron subir`)
    fotos.refetch({ silencioso: true })
  }
  const pendientes = subida.items.filter((i) => i.estado !== 'ok').length

  return (
    <>
      <Breadcrumbs items={[{ label: 'Panel', to: base }, { label: orden.codigo }]} />
      <PageHeader
        titulo={`${orden.vehiculos?.patente} · ${orden.codigo}`}
        acciones={
          <>
            {terminada && (
              <Button variant="primary" onClick={() => setNotificar('correo')}>
                Notificar al cliente
              </Button>
            )}
            {EDITABLE_INGRESO.includes(orden.estado) && <Button onClick={abrirEdicion}>Editar ingreso</Button>}
            {abierta && <Button onClick={() => setAsignar(true)}>{orden.mecanico_id ? 'Reasignar mecánico' : 'Asignar mecánico'}</Button>}
            <Button variant="ghost" onClick={() => setTab('ticket')}>
              Comprobante
            </Button>
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
          {abierta && <TransicionButtons orden={orden} onCambio={recargar} excluir={terminada ? ['listo_entrega'] : []} size="sm" />}
        </div>
      </Card>

      <div className="section">
        <OrdenResumen orden={orden} />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'resumen', label: 'Trabajo' },
          { value: 'fotos', label: 'Fotos', badge: fotos.data?.length || undefined },
          { value: 'avisos', label: 'Avisos al cliente', badge: avisos.data?.length || undefined },
          { value: 'historial', label: 'Historial' },
          { value: 'ticket', label: 'Comprobante' },
        ]}
      />

      {tab === 'resumen' && (
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
          <Card titulo="Presupuesto">
            {!pres.presupuestos.length ? (
              <EmptyState mensaje="Aún sin presupuesto" compacto />
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
          <Card titulo="Avances del mecánico" className="span-all">
            <AvancesList avances={avances.data} />
          </Card>
        </div>
      )}

      {tab === 'fotos' && (
        <div className="stack">
          <Card titulo="Fotografías de la orden">
            <FotoGallery fotos={fotos.data} loading={fotos.loading} />
          </Card>
          {abierta && (
            <Card
              titulo="Agregar fotografías"
              acciones={
                <span className="row-wrap">
                  <select className="input input--sm" value={tipoFoto} onChange={(e) => setTipoFoto(e.target.value)} aria-label="Tipo de foto" disabled={subida.subiendo}>
                    {TIPOS_FOTO.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <Button variant="primary" size="sm" disabled={!pendientes} loading={subida.subiendo} onClick={subirFotos}>
                    Subir {pendientes || ''} foto(s)
                  </Button>
                </span>
              }
            >
              <FotoUploader items={subida.items} rechazos={subida.rechazos} onAgregar={subida.agregar} onQuitar={subida.quitar} bloqueado={subida.subiendo} />
              {subida.subiendo && <ProgressBar value={subida.progresoTotal} />}
            </Card>
          )}
        </div>
      )}

      {tab === 'avisos' && (
        <Card
          titulo="Avisos enviados al cliente"
          acciones={
            terminada && (
              <Button size="sm" variant="primary" onClick={() => setNotificar('correo')}>
                Notificar
              </Button>
            )
          }
        >
          {!avisos.data?.length ? (
            <EmptyState mensaje="Aún no se ha avisado al cliente" compacto />
          ) : (
            <ul className="list">
              {avisos.data.map((n) => (
                <NotificacionItem key={n.id} n={n} />
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'historial' && (
        <Card titulo="Cambios de estado">
          <HistorialEstadosTimeline historial={historial.data} nombres={nombres} />
        </Card>
      )}

      {tab === 'ticket' && (
        <Card
          titulo="Comprobante de ingreso"
          acciones={
            <Button size="sm" onClick={() => imprimirPDF(`Orden ${orden.codigo}`)}>
              Imprimir
            </Button>
          }
        >
          <OrdenTicket orden={orden} vehiculo={orden.vehiculos} cliente={orden.clientes} ingreso={orden} />
        </Card>
      )}

      <AsignarMecanicoModal open={asignar} orden={orden} onClose={() => setAsignar(false)} onAsignado={recargar} />
      <NotificarClienteModal orden={notificar ? orden : null} canalInicial={notificar} base={base} onClose={() => setNotificar(null)} onNotificado={recargar} />
      <Modal
        open={Boolean(editar)}
        titulo="Editar datos de ingreso"
        onClose={() => setEditar(null)}
        footer={
          <>
            <Button onClick={() => setEditar(null)}>Cancelar</Button>
            <Button variant="primary" loading={guardando} onClick={guardarIngreso}>
              Guardar
            </Button>
          </>
        }
      >
        {editar && <OrdenIngresoForm value={editar} onChange={setEditar} errores={errores} idPrefix="edit-ot" />}
      </Modal>
    </>
  )
}
