import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import KpiCard from '@/components/ui/KpiCard'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import StockBadge from '@/components/domain/inventario/StockBadge'
import KardexTable from '@/components/domain/inventario/KardexTable'
import MovimientoForm from '@/components/domain/inventario/MovimientoForm'
import { useKardex } from '@/hooks/inventario/useKardex'
import { useSolicitudesCompra } from '@/hooks/taller/useSolicitudesCompra'
import { useToast } from '@/hooks/core/useToast'
import { formatCLP } from '@/lib/format'

const PAGE = 20

// CU-10 FA: ingreso de mercadería en un repuesto existente · RF28: kárdex y costo promedio
export default function RepuestoKardexPage() {
  const { repuestoId } = useParams()
  const toast = useToast()
  const [page, setPage] = useState(0)
  const [modo, setModo] = useState(null)
  const { repuesto, movimientos, registrarMovimiento, pending } = useKardex(repuestoId, { page, pageSize: PAGE })
  const sols = useSolicitudesCompra({ repuestoId })
  const abiertas = sols.solicitudes.filter((s) => ['pendiente', 'aprobada', 'comprada'].includes(s.estado))

  const r = repuesto.data
  if (repuesto.loading && !r) return <SplashScreen />
  if (repuesto.error) return <ErrorState mensaje={repuesto.error} onRetry={repuesto.refetch} />
  if (!r) return <EmptyState mensaje="Repuesto no encontrado" accion={<Button to="/admin/inventario">Volver</Button>} />

  const registrar = async (mov) => {
    const res = await registrarMovimiento(mov)
    if (res.ok) {
      toast.success(`Movimiento registrado. Stock: ${res.data.stock_resultante} u.`)
      sols.refetch({ silencioso: true })
    }
    return res
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Inventario', to: '/admin/inventario' }, { label: r.nombre }]} />
      <PageHeader
        titulo={r.nombre}
        subtitulo={`${r.codigo} · ${r.categorias_repuesto?.nombre ?? 'Sin categoría'}`}
        acciones={
          <>
            <Button to={`/admin/inventario/${r.id}/editar`}>Editar</Button>
            <Button onClick={() => setModo('ajuste')}>Ajustar stock</Button>
            <Button variant="primary" onClick={() => setModo('entrada')} disabled={!r.activo}>
              Ingresar mercadería
            </Button>
          </>
        }
      >
        <div className="row-wrap">
          <StockBadge stock={r.stock} minimo={r.stock_minimo} />
          {!r.activo && <Badge>Inactivo</Badge>}
        </div>
      </PageHeader>

      <div className="grid-kpi section">
        <KpiCard label="Stock" value={`${r.stock} u.`} detalle={`Mínimo: ${r.stock_minimo} u.`} />
        <KpiCard label="Costo promedio" value={formatCLP(r.costo_promedio)} detalle="Ponderado por cada ingreso" />
        <KpiCard label="Precio de venta" value={formatCLP(r.precio_venta)} detalle={Number(r.precio_venta) > 0 ? `Margen ${Math.round(((r.precio_venta - r.costo_promedio) / r.precio_venta) * 100)}%` : undefined} />
        <KpiCard label="Valor en bodega" value={formatCLP(r.stock * r.costo_promedio)} detalle={`${abiertas.length} solicitud(es) abierta(s)`} />
      </div>

      <Card titulo="Movimientos" padding={false}>
        <KardexTable movimientos={movimientos.data} loading={movimientos.loading} error={movimientos.error} onRetry={movimientos.refetch} />
        <Pagination page={page} pageSize={PAGE} total={movimientos.count} onChange={setPage} />
      </Card>

      <MovimientoForm open={Boolean(modo)} modo={modo} repuesto={r} solicitudes={abiertas} onClose={() => setModo(null)} onSubmit={registrar} pending={pending} />
    </>
  )
}
