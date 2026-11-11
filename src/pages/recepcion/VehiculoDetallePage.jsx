import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tabs from '@/components/ui/Tabs'
import DataTable from '@/components/ui/DataTable'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import FichaClienteVehiculo from '@/components/domain/clientes/FichaClienteVehiculo'
import VehiculoEditModal from '@/components/domain/clientes/VehiculoEditModal'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import ReporteChart from '@/components/domain/reportes/ReporteChart'
import { useVehiculo } from '@/hooks/clientes/useVehiculos'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useAuth } from '@/hooks/core/useAuth'
import { formatFecha, formatFechaHora, formatKm, formatNumero } from '@/lib/format'
import { labelDe, NIVELES_COMBUSTIBLE } from '@/lib/constants/enums'
import { rutaOrden } from '@/routes/paths'

// Ficha del vehículo: historial completo, diagnósticos, repuestos y kilometraje
export default function VehiculoDetallePage() {
  const { vehiculoId } = useParams()
  const base = useBasePath()
  const { rol } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('historial')
  const [editando, setEditando] = useState(false)
  const { ficha, loading, error, refetch } = useVehiculo(vehiculoId)

  if (loading && !ficha) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!ficha?.vehiculo) return <EmptyState mensaje="Vehículo no encontrado" accion={<Button to={`${base}/vehiculos`}>Volver a vehículos</Button>} />

  const { vehiculo: v, ordenes, diagnosticos, repuestos, ordenAbierta } = ficha
  const kms = [...ordenes].reverse()
  const ultimoKm = ordenes[0]?.kilometraje

  return (
    <>
      <Breadcrumbs items={[{ label: 'Vehículos', to: `${base}/vehiculos` }, { label: v.patente }]} />
      <PageHeader
        titulo={`${v.patente} · ${v.marca} ${v.modelo}`}
        subtitulo={`${v.anio}${v.color ? ` · ${v.color}` : ''}${v.vin ? ` · VIN ${v.vin}` : ''}`}
        acciones={
          <>
            <Button onClick={() => setEditando(true)}>Editar vehículo</Button>
            {ordenAbierta ? (
              <Button variant="primary" to={rutaOrden(rol, ordenAbierta.id)}>
                Ver orden abierta ({ordenAbierta.codigo})
              </Button>
            ) : (
              <Button variant="primary" to={`${base}/ordenes/nueva/${v.id}`}>
                Crear orden de trabajo
              </Button>
            )}
          </>
        }
      >
        {ordenAbierta && <EstadoBadge estado={ordenAbierta.estado} />}
      </PageHeader>

      <Card className="section">
        <FichaClienteVehiculo vehiculo={v} base={base} />
      </Card>

      <div className="grid-kpi section">
        <div className="card kpi">
          <div className="kpi__label">Visitas</div>
          <div className="kpi__value">{ordenes.length}</div>
        </div>
        <div className="card kpi">
          <div className="kpi__label">Último kilometraje</div>
          <div className="kpi__value">{formatKm(ultimoKm)}</div>
          <div className="kpi__detail">{ordenes[0] ? formatFecha(ordenes[0].fecha_ingreso) : 'Sin visitas'}</div>
        </div>
        <div className="card kpi">
          <div className="kpi__label">Repuestos cambiados</div>
          <div className="kpi__value">{repuestos.reduce((s, r) => s + Number(r.cantidad), 0)}</div>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'historial', label: 'Historial', badge: ordenes.length },
          { value: 'diagnosticos', label: 'Diagnósticos', badge: diagnosticos.length },
          { value: 'repuestos', label: 'Repuestos', badge: repuestos.length },
          { value: 'km', label: 'Kilometraje' },
        ]}
      />

      {tab === 'historial' && (
        <Card padding={false}>
          <DataTable
            rows={ordenes}
            emptyMessage="Sin órdenes registradas"
            onRowClick={(o) => navigate(rutaOrden(rol, o.id))}
            columns={[
              { key: 'fecha', header: 'Ingreso', render: (o) => formatFecha(o.fecha_ingreso) },
              { key: 'codigo', header: 'Orden', render: (o) => <code className="code">{o.codigo}</code> },
              { key: 'km', header: 'Km', align: 'right', render: (o) => formatKm(o.kilometraje) },
              { key: 'comb', header: 'Combustible', render: (o) => labelDe(NIVELES_COMBUSTIBLE, o.nivel_combustible) },
              { key: 'motivo', header: 'Motivo', render: (o) => <span className="truncate">{o.motivo_ingreso}</span> },
              { key: 'obs', header: 'Trabajo realizado', render: (o) => <span className="truncate">{o.observaciones_finales ?? '—'}</span> },
              { key: 'entrega', header: 'Entrega', render: (o) => formatFecha(o.fecha_entrega) },
              { key: 'estado', header: 'Estado', render: (o) => <EstadoBadge estado={o.estado} /> },
            ]}
          />
        </Card>
      )}

      {tab === 'diagnosticos' && (
        <Card>
          {!diagnosticos.length ? (
            <EmptyState mensaje="Sin diagnósticos previos" compacto />
          ) : (
            <ul className="list">
              {diagnosticos.map((d) => (
                <li key={d.id} className="list__item list__item--block">
                  <div className="row-wrap">
                    <strong>{formatFechaHora(d.created_at)}</strong>
                    <code className="code">{d.ordenes_trabajo?.codigo}</code>
                    <span className="muted small">
                      {formatKm(d.ordenes_trabajo?.kilometraje)} · {d.perfiles?.nombre_completo}
                    </span>
                  </div>
                  <p>{d.descripcion}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'repuestos' && (
        <Card padding={false}>
          <DataTable
            rows={repuestos}
            emptyMessage="Sin repuestos utilizados"
            columns={[
              { key: 'fecha', header: 'Fecha', render: (r) => formatFecha(r.ordenes_trabajo?.fecha_ingreso) },
              { key: 'orden', header: 'Orden', render: (r) => <code className="code">{r.ordenes_trabajo?.codigo}</code> },
              { key: 'codigo', header: 'Código', render: (r) => r.repuestos?.codigo },
              { key: 'nombre', header: 'Repuesto', render: (r) => r.repuestos?.nombre },
              { key: 'cantidad', header: 'Cant.', align: 'right' },
              { key: 'km', header: 'Km', align: 'right', render: (r) => formatKm(r.ordenes_trabajo?.kilometraje) },
            ]}
          />
        </Card>
      )}

      {tab === 'km' && (
        <Card titulo="Kilometraje histórico">
          {!kms.length ? (
            <EmptyState mensaje="Sin registros de kilometraje" compacto />
          ) : (
            <>
              <ReporteChart
                titulo="Kilometraje por visita"
                data={kms.map((o) => ({ label: formatFecha(o.fecha_ingreso), km: o.kilometraje }))}
                series={[{ key: 'km', label: 'Kilometraje', color: '#1F4FBF' }]}
                format={(n) => formatNumero(n)}
                height={220}
              />
              <DataTable
                rows={ordenes}
                columns={[
                  { key: 'fecha', header: 'Fecha', render: (o) => formatFecha(o.fecha_ingreso) },
                  { key: 'km', header: 'Kilometraje', align: 'right', render: (o) => formatKm(o.kilometraje) },
                  {
                    key: 'dif',
                    header: 'Recorrido desde la visita anterior',
                    align: 'right',
                    render: (o) => {
                      const i = ordenes.indexOf(o)
                      const prev = ordenes[i + 1]
                      return prev ? formatKm(o.kilometraje - prev.kilometraje) : '—'
                    },
                  },
                ]}
              />
            </>
          )}
        </Card>
      )}

      <VehiculoEditModal vehiculo={editando ? v : null} onClose={() => setEditando(false)} onGuardado={() => refetch({ silencioso: true })} />
    </>
  )
}
