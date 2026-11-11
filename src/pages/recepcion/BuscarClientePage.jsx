import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'
import FormField from '@/components/ui/FormField'
import Badge from '@/components/ui/Badge'
import ClienteEditModal from '@/components/domain/clientes/ClienteEditModal'
import { useClientes } from '@/hooks/clientes/useClientes'
import { useBasePath } from '@/hooks/core/useBasePath'
import { formatearRut } from '@/lib/rut'
import { formatFecha } from '@/lib/format'

const PAGE = 20

// Recepción › Clientes: búsqueda por RUT, nombre o teléfono (RNF05)
export default function BuscarClientePage() {
  const base = useBasePath()
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [page, setPage] = useState(0)
  const [editando, setEditando] = useState(null)
  const { clientes, total, loading, error, refetch } = useClientes({ texto, page, pageSize: PAGE })

  return (
    <>
      <PageHeader
        titulo="Clientes"
        subtitulo={total != null ? `${total} cliente(s)` : undefined}
        acciones={
          <Button variant="primary" to={`${base}/registro`}>
            Registrar ingreso
          </Button>
        }
      />
      <Card className="filters">
        <FormField label="Buscar por RUT, nombre o teléfono" htmlFor="buscar-cli">
          <SearchInput
            id="buscar-cli"
            placeholder="12.345.678-9, Juan Pérez o 912345678"
            onSearch={(t) => {
              setTexto(t)
              setPage(0)
            }}
          />
        </FormField>
      </Card>
      <Card padding={false}>
        <DataTable
          loading={loading}
          error={error}
          onRetry={refetch}
          rows={clientes}
          emptyMessage={texto ? `Sin resultados para “${texto}”` : 'Aún no hay clientes registrados'}
          onRowClick={(c) => navigate(`${base}/clientes/${c.id}`)}
          columns={[
            {
              key: 'cliente',
              header: 'Cliente',
              render: (c) => (
                <div className="cell-stack">
                  <strong>{c.nombre}</strong>
                  <span className="muted small">
                    {formatearRut(c.rut)} · {c.telefono}
                    {c.correo ? ` · ${c.correo}` : ''}
                  </span>
                </div>
              ),
            },
            {
              key: 'vehiculos',
              header: 'Vehículos registrados',
              render: (c) =>
                c.vehiculos?.length ? (
                  <span className="row-wrap">
                    {c.vehiculos.map((v) => (
                      <Badge key={v.id}>{v.patente}</Badge>
                    ))}
                  </span>
                ) : (
                  <span className="muted">—</span>
                ),
            },
            { key: 'ultima', header: 'Última visita', render: (c) => (c.ordenes_trabajo?.[0] ? formatFecha(c.ordenes_trabajo[0].fecha_ingreso) : 'Sin visitas') },
            {
              key: 'acc',
              header: 'Acciones',
              align: 'right',
              render: (c) => (
                <span className="row-wrap row-end" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" to={`${base}/clientes/${c.id}`}>
                    Ver ficha
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditando(c)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="primary" to={`${base}/registro?clienteId=${c.id}`}>
                    Crear ingreso
                  </Button>
                </span>
              ),
            },
          ]}
        />
        <Pagination page={page} pageSize={PAGE} total={total} onChange={setPage} />
      </Card>
      <ClienteEditModal cliente={editando} onClose={() => setEditando(null)} onGuardado={() => refetch({ silencioso: true })} />
    </>
  )
}
