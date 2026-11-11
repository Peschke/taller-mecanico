import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import FormField from '@/components/ui/FormField'
import Pagination from '@/components/ui/Pagination'
import Badge from '@/components/ui/Badge'
import StockBadge from '@/components/domain/inventario/StockBadge'
import { useCatalogoRepuestos } from '@/hooks/inventario/useCatalogoRepuestos'
import { useStockBajo } from '@/hooks/inventario/useStockBajo'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { formatCLP } from '@/lib/format'

const PAGE = 25

// CU-10 · Registrar y controlar inventario de repuestos
export default function InventarioPage() {
  const navigate = useNavigate()
  const { categorias } = useCatalogos()
  const [texto, setTexto] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [inactivos, setInactivos] = useState(false)
  const [page, setPage] = useState(0)

  const { repuestos, total, loading, error, refetch } = useCatalogoRepuestos({
    texto,
    categoriaId: categoriaId || undefined,
    incluirInactivos: inactivos,
    page,
    pageSize: PAGE,
  })
  const bajo = useStockBajo()

  return (
    <>
      <PageHeader
        titulo="Inventario y bodega"
        subtitulo={total != null ? `${total} repuesto(s)` : undefined}
        acciones={
          <>
            <Button to="/admin/compras">Solicitudes de compra</Button>
            <Button variant="primary" to="/admin/inventario/nuevo">
              Ingresar repuesto
            </Button>
          </>
        }
      />

      {bajo.data?.length > 0 && (
        <Card className="section alerta">
          <strong>{bajo.data.length} repuesto(s) en o bajo el stock mínimo:</strong>{' '}
          {bajo.data.slice(0, 5).map((r, i) => (
            <span key={r.id}>
              {i > 0 && ', '}
              <Link to={`/admin/inventario/${r.id}`}>{r.nombre}</Link> ({r.stock})
            </span>
          ))}
          {bajo.data.length > 5 && '…'}
        </Card>
      )}

      <Card className="filters">
        <div className="filters__row">
          <FormField label="Buscar" htmlFor="buscar-rep" className="grow">
            <SearchInput
              id="buscar-rep"
              placeholder="Nombre o código"
              onSearch={(t) => {
                setTexto(t)
                setPage(0)
              }}
            />
          </FormField>
          <FormField label="Categoría" htmlFor="f-cat">
            <Select
              id="f-cat"
              value={categoriaId}
              onChange={(e) => {
                setCategoriaId(e.target.value)
                setPage(0)
              }}
              placeholder="Todas"
              options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </FormField>
          <Checkbox id="f-inact" label="Incluir inactivos" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} />
        </div>
      </Card>

      <Card padding={false}>
        <DataTable
          loading={loading}
          error={error}
          onRetry={refetch}
          rows={repuestos}
          emptyMessage={texto ? 'Sin coincidencias' : 'Aún no hay repuestos. Ingresa el primero.'}
          onRowClick={(r) => navigate(`/admin/inventario/${r.id}`)}
          columns={[
            { key: 'codigo', header: 'Código', render: (r) => <code className="code">{r.codigo}</code> },
            {
              key: 'nombre',
              header: 'Nombre',
              render: (r) => (
                <span>
                  {r.nombre} {!r.activo && <Badge>Inactivo</Badge>}
                </span>
              ),
            },
            { key: 'cat', header: 'Categoría', render: (r) => r.categorias_repuesto?.nombre ?? '—' },
            { key: 'stock', header: 'Stock', render: (r) => <StockBadge stock={r.stock} minimo={r.stock_minimo} /> },
            { key: 'min', header: 'Mín.', align: 'right', render: (r) => r.stock_minimo },
            { key: 'costo', header: 'Costo prom.', align: 'right', render: (r) => formatCLP(r.costo_promedio) },
            { key: 'precio', header: 'Precio venta', align: 'right', render: (r) => formatCLP(r.precio_venta) },
            {
              key: 'margen',
              header: 'Margen',
              align: 'right',
              render: (r) => (Number(r.precio_venta) > 0 ? `${Math.round(((r.precio_venta - r.costo_promedio) / r.precio_venta) * 100)}%` : '—'),
            },
            {
              key: 'acc',
              header: '',
              align: 'right',
              render: (r) => (
                <span className="row-wrap" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" to={`/admin/inventario/${r.id}`}>
                    Kárdex
                  </Button>
                  <Button size="sm" variant="ghost" to={`/admin/inventario/${r.id}/editar`}>
                    Editar
                  </Button>
                </span>
              ),
            },
          ]}
        />
        <Pagination page={page} pageSize={PAGE} total={total} onChange={setPage} />
      </Card>
    </>
  )
}
