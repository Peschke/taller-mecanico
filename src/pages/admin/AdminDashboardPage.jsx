import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import KpiCard from '@/components/ui/KpiCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Tabs from '@/components/ui/Tabs'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import ReporteChart from '@/components/domain/reportes/ReporteChart'
import OrdenesTable from '@/components/domain/ordenes/OrdenesTable'
import StockBadge from '@/components/domain/inventario/StockBadge'
import { usePanelOrdenes } from '@/hooks/ordenes/usePanelOrdenes'
import { useStockBajo } from '@/hooks/inventario/useStockBajo'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useNotificaciones } from '@/hooks/comunicacion/useNotificaciones'
import { reportesService } from '@/services/reportesService'
import { pagosService } from '@/services/pagosService'
import { ETAPAS } from '@/lib/constants/estados'
import { MENSAJES } from '@/lib/constants/mensajes'
import { formatCLP, formatHoras, formatMes, formatRelativo } from '@/lib/format'
import { mesActual, mesCorto, primerDia, sumarMeses } from '@/lib/fechas'

const variacion = (actual, anterior) => {
  if (!anterior) return null
  const pct = Math.round(((actual - anterior) / Math.abs(anterior)) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}% vs. mes anterior`
}

const ATENCION = [
  { value: 'todas', label: 'Todas', estados: ['diagnosticado', 'presupuesto_rechazado', 'listo_entrega'] },
  { value: 'presupuestar', label: 'Por presupuestar', estados: ['diagnosticado'] },
  { value: 'rechazados', label: 'Rechazados', estados: ['presupuesto_rechazado'] },
  { value: 'cobrar', label: 'Por cobrar', estados: ['listo_entrega'] },
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [mes, setMes] = useState(mesActual())
  const [filtroAtencion, setFiltroAtencion] = useState('todas')

  // ① Resultados del mes y del anterior
  const fin = useSupabaseQuery(() => reportesService.financiero(sumarMeses(mes, -1), mes), [mes], { initialData: [] })
  const filaMes = (m) => fin.data?.find((r) => String(r.mes).startsWith(m)) ?? null
  const actual = filaMes(mes)
  const anterior = filaMes(sumarMeses(mes, -1))

  // ② Autos abiertos por etapa (en vivo) y ③ flujo de 6 meses
  const abiertas = usePanelOrdenes({ excluirCerradas: true, orden: { col: 'horas_en_taller', asc: false } })
  const flujo = useSupabaseQuery(() => reportesService.flujo(sumarMeses(mesActual(), -5), mesActual()), [], { initialData: [] })

  const porEtapa = useMemo(() => {
    const c = Object.fromEntries(ETAPAS.map((e) => [e, 0]))
    for (const o of abiertas.ordenes) if (c[o.etapa] != null) c[o.etapa] += 1
    c.Entregado = flujo.data?.find((f) => String(f.mes) === primerDia(mesActual()))?.entregados ?? 0
    return c
  }, [abiertas.ordenes, flujo.data])

  // ④ Requiere atención (+ saldo de las por cobrar)
  const atencionEstados = ATENCION.find((a) => a.value === filtroAtencion).estados
  const atencion = abiertas.ordenes.filter((o) => atencionEstados.includes(o.estado))
  const saldos = useSupabaseQuery(() => pagosService.porCobrar(), [abiertas.ordenes.length], { initialData: [] })
  const saldoDe = (id) => saldos.data?.find((s) => s.orden_id === id)?.saldo

  const stock = useStockBajo()
  const { items: notifs } = useNotificaciones()

  const accionFila = (o) => {
    if (o.estado === 'diagnosticado') return <Button size="sm" variant="primary" to={`/admin/ordenes/${o.id}/presupuesto`}>Armar presupuesto</Button>
    if (o.estado === 'presupuesto_rechazado') return <Button size="sm" to="/admin/presupuestos?tab=rechazados">Revisar</Button>
    if (o.estado === 'listo_entrega') return <Button size="sm" variant="primary" to={`/admin/ordenes/${o.id}/cobro`}>Cobrar</Button>
    return null
  }

  return (
    <>
      <PageHeader
        titulo="Panel"
        subtitulo={abiertas.realtimeStatus === 'SUBSCRIBED' ? 'En vivo' : 'Conectando…'}
        acciones={
          <>
            <label className="field__label inline-label">
              Mes
              <input type="month" className="input" value={mes} max={mesActual()} onChange={(e) => e.target.value && setMes(e.target.value)} />
            </label>
            <Button to="/admin/reportes">Ver reportes</Button>
          </>
        }
      />

      <section className="section">
        <h2 className="section__title">Resultados de {formatMes(primerDia(mes))}</h2>
        {fin.error ? (
          <ErrorState mensaje={fin.error} onRetry={fin.refetch} />
        ) : !fin.loading && !actual ? (
          <Card>
            <EmptyState mensaje={MENSAJES.SIN_DATOS_PERIODO} />
          </Card>
        ) : (
          <div className="grid-kpi">
            <KpiCard loading={fin.loading} label="Facturado" value={formatCLP(actual?.facturado)} detalle={variacion(actual?.facturado, anterior?.facturado) ?? `${actual?.ordenes_cerradas ?? 0} órdenes cerradas`} />
            <KpiCard loading={fin.loading} label="Margen bruto" value={formatCLP(actual?.margen_bruto)} detalle={variacion(actual?.margen_bruto, anterior?.margen_bruto)} />
            <KpiCard loading={fin.loading} label="Ingresos de caja" value={formatCLP(actual?.ingresos_caja)} detalle={variacion(actual?.ingresos_caja, anterior?.ingresos_caja)} />
            <KpiCard loading={fin.loading} label="Compras de repuestos" value={formatCLP(actual?.egresos_compras)} detalle={`${actual?.abonos ?? 0} abonos registrados`} />
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section__title">Autos por etapa</h2>
        {abiertas.error ? (
          <ErrorState mensaje={abiertas.error} onRetry={abiertas.refetch} />
        ) : (
          <div className="grid-etapas">
            {ETAPAS.map((e) => (
              <Link key={e} to={`/admin/ordenes?etapa=${encodeURIComponent(e)}`} className="card etapa-chip">
                <span className="muted small">{e === 'Entregado' ? 'Entregado (mes)' : e}</span>
                <strong className="etapa-chip__n">{abiertas.loading && !abiertas.ordenes.length ? '…' : porEtapa[e]}</strong>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid-2 section">
        <Card titulo="Flujo de vehículos · 6 meses">
          {flujo.loading && !flujo.data?.length ? (
            <Skeleton height={220} />
          ) : flujo.data?.length ? (
            <ReporteChart
              titulo="Ingresados y entregados por mes"
              data={flujo.data.map((f) => ({ label: mesCorto(f.mes), ingresados: f.ingresados, entregados: f.entregados }))}
              series={[
                { key: 'ingresados', label: 'Ingresados', color: '#9DB4EA' },
                { key: 'entregados', label: 'Entregados', color: '#1F4FBF' },
              ]}
              height={220}
            />
          ) : (
            <EmptyState mensaje={MENSAJES.SIN_DATOS_PERIODO} compacto />
          )}
        </Card>
        <Card titulo="Stock bajo" acciones={<Button size="sm" to="/admin/compras">Ver compras</Button>}>
          {stock.loading && !stock.data?.length ? (
            <Skeleton height={120} />
          ) : !stock.data?.length ? (
            <EmptyState mensaje="Todos los repuestos sobre el mínimo" compacto />
          ) : (
            <ul className="list">
              {stock.data.slice(0, 6).map((r) => (
                <li key={r.id} className="list__item">
                  <Link to={`/admin/inventario/${r.id}`} className="list__main">
                    <span className="list__title">{r.nombre}</span>
                    <span className="muted small">
                      {r.codigo} · mínimo {r.stock_minimo}
                    </span>
                  </Link>
                  <div className="row-wrap">
                    <StockBadge stock={r.stock} minimo={r.stock_minimo} />
                    {r.solicitudes_abiertas > 0 && <Badge>{r.solicitudes_abiertas} solicitud(es)</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card titulo="Requiere atención" className="section" padding={false}>
        <div className="pad-x">
          <Tabs value={filtroAtencion} onChange={setFiltroAtencion} tabs={ATENCION.map((a) => ({ ...a, badge: abiertas.ordenes.filter((o) => a.estados.includes(o.estado)).length }))} />
        </div>
        <OrdenesTable
          ordenes={atencion}
          loading={abiertas.loading}
          emptyMessage="Nada pendiente en este grupo"
          accion={accionFila}
          columnasExtra={[
            {
              key: 'saldo',
              header: 'Saldo',
              align: 'right',
              render: (o) => (o.estado === 'listo_entrega' ? formatCLP(saldoDe(o.id) ?? 0) : '—'),
            },
          ]}
        />
      </Card>

      <div className="grid-2 section">
        <Card titulo="Más tiempo en taller">
          {!abiertas.ordenes.length ? (
            <EmptyState mensaje={MENSAJES.SIN_VEHICULOS_TALLER} compacto />
          ) : (
            <ol className="list">
              {abiertas.ordenes.slice(0, 5).map((o) => (
                <li key={o.id} className="list__item list__item--click" onClick={() => navigate(`/admin/ordenes/${o.id}`)}>
                  <div className="list__main">
                    <span className="list__title">
                      {o.patente} · {o.marca} {o.modelo}
                    </span>
                    <span className="muted small">
                      {o.codigo} · {o.estado_texto} · {o.mecanico ?? 'Sin asignar'}
                    </span>
                  </div>
                  <strong>{formatHoras(o.horas_en_taller)}</strong>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card titulo="Notificaciones recientes" acciones={<Link to="/admin/notificaciones">Ver todas</Link>}>
          {!notifs.length ? (
            <EmptyState mensaje={MENSAJES.SIN_NOTIFICACIONES} compacto />
          ) : (
            <ul className="list">
              {notifs.slice(0, 5).map((n) => (
                <li key={n.id} className={['list__item', !n.leida_en && 'list__item--unread'].filter(Boolean).join(' ')}>
                  <div className="list__main">
                    <span className="list__title">{n.mensaje}</span>
                    <span className="muted small">{formatRelativo(n.created_at)}</span>
                  </div>
                  {n.orden_id && (
                    <Button size="sm" variant="ghost" to={`/admin/ordenes/${n.orden_id}`}>
                      Ver
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
