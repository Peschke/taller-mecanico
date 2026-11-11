import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import ClienteEditModal from '@/components/domain/clientes/ClienteEditModal'
import { useCliente } from '@/hooks/clientes/useClientes'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useAuth } from '@/hooks/core/useAuth'
import { formatearRut } from '@/lib/rut'
import { formatCLP, formatFecha, formatKm } from '@/lib/format'
import { estaAbierta } from '@/lib/constants/estados'
import { rutaOrden } from '@/routes/paths'

// Ficha del cliente: datos, vehículos, historial, últimos trabajos y facturado
export default function ClienteDetallePage() {
  const { clienteId } = useParams()
  const base = useBasePath()
  const { rol } = useAuth()
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const { ficha, loading, error, refetch } = useCliente(clienteId)

  if (loading && !ficha) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!ficha?.cliente) return <EmptyState mensaje="Cliente no encontrado" accion={<Button to={`${base}/clientes`}>Volver a clientes</Button>} />

  const { cliente: c, vehiculos, ordenes, facturado, trabajos } = ficha
  const abiertas = ordenes.filter((o) => estaAbierta(o.estado))
  const cerradas = ordenes.filter((o) => o.estado === 'pagado_cerrado')

  return (
    <>
      <Breadcrumbs items={[{ label: 'Clientes', to: `${base}/clientes` }, { label: c.nombre }]} />
      <PageHeader
        titulo={c.nombre}
        subtitulo={`${formatearRut(c.rut)} · cliente desde ${formatFecha(c.created_at)}`}
        acciones={
          <>
            <Button onClick={() => setEditando(true)}>Editar datos</Button>
            <Button variant="primary" to={`${base}/registro?clienteId=${c.id}`}>
              Registrar otro vehículo
            </Button>
          </>
        }
      >
        {c.auth_user_id && <Badge tono="info">Usa el portal del cliente</Badge>}
      </PageHeader>

      <div className="grid-kpi section">
        <KpiCard label="Monto facturado" value={formatCLP(facturado)} detalle={`${cerradas.length} servicio(s) cerrados`} />
        <KpiCard label="Visitas" value={ordenes.length} detalle={ordenes[0] ? `Última: ${formatFecha(ordenes[0].fecha_ingreso)}` : 'Sin visitas'} />
        <KpiCard label="Vehículos" value={vehiculos.length} />
        <KpiCard label="Órdenes abiertas" value={abiertas.length} />
      </div>

      <div className="grid-2 section">
        <Card titulo="Datos personales">
          <dl className="dl">
            <dt>RUT</dt>
            <dd>{formatearRut(c.rut)}</dd>
            <dt>Teléfono</dt>
            <dd>
              <a href={`tel:${c.telefono}`}>{c.telefono}</a>
            </dd>
            <dt>Correo</dt>
            <dd>{c.correo ?? <span className="muted">Sin correo</span>}</dd>
          </dl>
        </Card>
        <Card titulo="Vehículos asociados">
          {!vehiculos.length ? (
            <EmptyState mensaje="Sin vehículos" compacto />
          ) : (
            <ul className="list">
              {vehiculos.map((v) => {
                const abierta = abiertas.find((o) => o.vehiculos?.id === v.id)
                return (
                  <li key={v.id} className="list__item">
                    <div className="list__main">
                      <span className="list__title">
                        {v.patente} · {v.marca} {v.modelo} {v.anio}
                      </span>
                      {abierta && <span className="small">En taller: {abierta.codigo}</span>}
                    </div>
                    <span className="row-wrap">
                      <Button size="sm" to={`${base}/vehiculos/${v.id}`}>
                        Ficha
                      </Button>
                      {abierta ? (
                        <Button size="sm" variant="ghost" to={rutaOrden(rol, abierta.id)}>
                          Ver orden
                        </Button>
                      ) : (
                        <Button size="sm" variant="primary" to={`${base}/ordenes/nueva/${v.id}`}>
                          Crear orden
                        </Button>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card titulo="Historial de órdenes" padding={false} className="section">
        <DataTable
          rows={ordenes}
          emptyMessage="Sin órdenes registradas"
          onRowClick={(o) => navigate(rutaOrden(rol, o.id))}
          columns={[
            { key: 'fecha', header: 'Ingreso', render: (o) => formatFecha(o.fecha_ingreso) },
            { key: 'codigo', header: 'Orden', render: (o) => <code className="code">{o.codigo}</code> },
            { key: 'vehiculo', header: 'Vehículo', render: (o) => `${o.vehiculos?.patente} · ${o.vehiculos?.marca} ${o.vehiculos?.modelo}` },
            { key: 'km', header: 'Km', align: 'right', render: (o) => formatKm(o.kilometraje) },
            { key: 'motivo', header: 'Motivo', render: (o) => <span className="truncate">{o.motivo_ingreso}</span> },
            { key: 'estado', header: 'Estado', render: (o) => <EstadoBadge estado={o.estado} /> },
          ]}
        />
      </Card>

      <Card titulo="Últimos trabajos realizados">
        {!trabajos.length ? (
          <EmptyState mensaje="Aún no hay trabajos completados" compacto />
        ) : (
          <ul className="list">
            {trabajos.map((t) => (
              <li key={t.id} className="list__item">
                <div className="list__main">
                  <span className="list__title">{t.descripcion}</span>
                  <span className="muted small">
                    {t.ordenes_trabajo?.vehiculos?.patente} · {t.ordenes_trabajo?.codigo}
                  </span>
                </div>
                <span className="muted small">{formatFecha(t.completada_en ?? t.ordenes_trabajo?.fecha_ingreso)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ClienteEditModal cliente={editando ? c : null} onClose={() => setEditando(false)} onGuardado={() => refetch({ silencioso: true })} />
    </>
  )
}
