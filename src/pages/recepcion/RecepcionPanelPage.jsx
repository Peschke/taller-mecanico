import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import FormField from '@/components/ui/FormField'
import Icon from '@/components/layout/Icon'
import PatenteInput from '@/components/domain/clientes/PatenteInput'
import OrdenesTable from '@/components/domain/ordenes/OrdenesTable'
import AsignarMecanicoModal from '@/components/domain/ordenes/AsignarMecanicoModal'
import NotificarClienteModal from '@/components/domain/notificaciones/NotificarClienteModal'
import { useRecepcion } from '@/hooks/recepcion/useRecepcion'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useAuth } from '@/hooks/core/useAuth'
import { useToast } from '@/hooks/core/useToast'
import { vehiculosService } from '@/services/vehiculosService'
import { recepcionService } from '@/services/recepcionService'
import { patenteValida } from '@/lib/patente'
import { rutaOrden } from '@/routes/paths'
import { formatHoras, formatRelativo } from '@/lib/format'
import { MENSAJES } from '@/lib/constants/mensajes'

function Kpi({ titulo, valor, detalle, to, tono }) {
  const clase = ['card kpi kpi--link', tono && `kpi--${tono}`].filter(Boolean).join(' ')
  const contenido = (
    <>
      <div className="kpi__label">{titulo}</div>
      <div className="kpi__value">{valor}</div>
      {detalle && <div className="kpi__detail">{detalle}</div>}
    </>
  )
  // Anclas dentro de la misma página: <a href="#…">; rutas: <Link>
  return to.startsWith('#') ? (
    <a href={to} className={clase}>
      {contenido}
    </a>
  ) : (
    <Link to={to} className={clase}>
      {contenido}
    </Link>
  )
}

// Dashboard operativo de recepción (RNF02)
export default function RecepcionPanelPage() {
  const base = useBasePath()
  const { rol } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const r = useRecepcion()
  const [patente, setPatente] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [asignando, setAsignando] = useState(null)
  const [notificando, setNotificando] = useState(null)

  // Ingreso rápido: patente existente → nueva orden (o la abierta); nueva → registro
  const ingresoRapido = async (e) => {
    e.preventDefault()
    if (!patenteValida(patente)) return toast.error('Patente inválida: 5 a 8 letras y números.')
    setBuscando(true)
    const { data: v, error } = await vehiculosService.obtenerPorPatente(patente)
    if (error) {
      setBuscando(false)
      return toast.error('No se pudo buscar la patente.')
    }
    if (!v) {
      setBuscando(false)
      return navigate(`${base}/registro?patente=${patente}`)
    }
    const { data: abierta } = await vehiculosService.ordenAbierta(v.id)
    setBuscando(false)
    if (abierta) {
      toast.info(`${v.patente} ya tiene la orden ${abierta.codigo} abierta.`)
      return navigate(rutaOrden(rol, abierta.id))
    }
    navigate(`${base}/ordenes/nueva/${v.id}`)
  }

  const abrirNotificar = async (o) => {
    const { data, error } = await recepcionService.ordenParaNotificar(o.id)
    if (error || !data) return toast.error('No se pudo cargar la orden.')
    setNotificando(data)
  }

  const cargando = r.loading && !r.enTaller

  return (
    <>
      <PageHeader
        titulo="Recepción"
        subtitulo={r.realtimeStatus === 'SUBSCRIBED' ? 'Panel en vivo' : 'Conectando…'}
        acciones={
          <Button variant="primary" to={`${base}/registro`}>
            Registrar ingreso
          </Button>
        }
      />

      <div className="grid-kpi section">
        <Kpi titulo="Ingresados hoy" valor={cargando ? '…' : r.ingresadosHoy.length} detalle={`${r.enTaller} en el taller`} to="#ingresados-hoy" />
        <Kpi titulo="Por asignar" valor={cargando ? '…' : r.porAsignar.length} detalle="Sin mecánico" to="#por-asignar" tono={r.porAsignar.length ? 'warning' : undefined} />
        <Kpi titulo="Por notificar" valor={cargando ? '…' : r.porNotificar.length} detalle="Trabajo terminado" to={`${base}/por-notificar`} tono={r.porNotificar.length ? 'accent' : undefined} />
        <Kpi titulo="Listos para entrega" valor={cargando ? '…' : r.listosEntrega.length} detalle="Cliente avisado" to="#listos" />
      </div>

      <div className="grid-2 section">
        <Card titulo="Ingreso rápido">
          <form className="inline-form" onSubmit={ingresoRapido}>
            <FormField label="Patente" htmlFor="ingreso-patente" className="grow">
              <PatenteInput id="ingreso-patente" value={patente} onChange={setPatente} />
            </FormField>
            <Button type="submit" variant="primary" loading={buscando}>
              Continuar
            </Button>
          </form>
          <p className="muted small">Si la patente existe se abre la nueva orden; si no, el registro del cliente y vehículo.</p>
        </Card>
        <Card titulo="Accesos rápidos">
          <div className="quick">
            <Link to={`${base}/registro`} className="quick__item">
              <Icon name="registro" /> Registrar ingreso
            </Link>
            <Link to={`${base}/clientes`} className="quick__item">
              <Icon name="clientes" /> Clientes
            </Link>
            <Link to={`${base}/vehiculos`} className="quick__item">
              <Icon name="auto" /> Vehículos
            </Link>
            <Link to={`${base}/por-notificar`} className="quick__item">
              <Icon name="notificar" /> Por notificar
            </Link>
          </div>
        </Card>
      </div>

      {r.error && <ErrorState mensaje={r.error} onRetry={r.refetch} />}

      <Card titulo="En el taller por etapa" className="section">
        <div className="grid-etapas">
          {Object.entries(r.porEtapa).map(([etapa, n]) => (
            <div key={etapa} className="etapa-chip etapa-chip--static">
              <span className="muted small">{etapa}</span>
              <strong className="etapa-chip__n">{cargando ? '…' : n}</strong>
            </div>
          ))}
        </div>
      </Card>

      <Card titulo="Por asignar" id="por-asignar" padding={false} className="section">
        <OrdenesTable
          ordenes={r.porAsignar}
          loading={r.loading}
          linkBase={rol === 'admin' ? '/admin/ordenes' : '/recepcion/ordenes'}
          emptyMessage="Todas las órdenes tienen mecánico"
          accion={(o) => (
            <Button size="sm" variant="primary" onClick={() => setAsignando(o)}>
              Asignar mecánico
            </Button>
          )}
        />
      </Card>

      <div className="grid-2 section">
        <Card titulo="Terminados por notificar" acciones={<Link to={`${base}/por-notificar`}>Ver todos</Link>}>
          {cargando ? (
            <Skeleton height={80} />
          ) : !r.porNotificar.length ? (
            <EmptyState mensaje="Ningún vehículo pendiente de aviso" compacto />
          ) : (
            <ul className="list">
              {r.porNotificar.map((o) => (
                <li key={o.id} className="list__item">
                  <div className="list__main">
                    <span className="list__title">
                      {o.patente} · {o.marca} {o.modelo}
                    </span>
                    <span className="muted small">
                      {o.cliente} · <a href={`tel:${o.cliente_telefono}`}>{o.cliente_telefono}</a> · terminado {formatRelativo(o.updated_at)}
                    </span>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => abrirNotificar(o)}>
                    Notificar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card titulo="Listos para entrega" id="listos">
          {cargando ? (
            <Skeleton height={80} />
          ) : !r.listosEntrega.length ? (
            <EmptyState mensaje="No hay vehículos esperando retiro" compacto />
          ) : (
            <ul className="list">
              {r.listosEntrega.map((o) => (
                <li key={o.id} className="list__item list__item--click" onClick={() => navigate(rutaOrden(rol, o.id))}>
                  <div className="list__main">
                    <span className="list__title">
                      {o.patente} · {o.marca} {o.modelo}
                    </span>
                    <span className="muted small">
                      {o.cliente} · {o.cliente_telefono}
                    </span>
                  </div>
                  <Badge tono="success">Avisado</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card titulo="Ingresados hoy" id="ingresados-hoy" padding={false}>
        {!r.loading && !r.ingresadosHoy.length ? (
          <EmptyState mensaje="Aún no ingresan vehículos hoy" accion={<Button to={`${base}/registro`}>Registrar ingreso</Button>} />
        ) : (
          <OrdenesTable
            ordenes={r.ingresadosHoy}
            loading={r.loading}
            linkBase={rol === 'admin' ? '/admin/ordenes' : '/recepcion/ordenes'}
            emptyMessage={MENSAJES.SIN_VEHICULOS_TALLER}
            columnasExtra={[{ key: 'h', header: 'Hace', align: 'right', render: (o) => formatHoras(o.horas_en_taller) }]}
          />
        )}
      </Card>

      <AsignarMecanicoModal open={Boolean(asignando)} orden={asignando} onClose={() => setAsignando(null)} onAsignado={r.refetch} />
      <NotificarClienteModal orden={notificando} canalInicial="email" base={base} onClose={() => setNotificando(null)} onNotificado={r.refetch} />
    </>
  )
}
