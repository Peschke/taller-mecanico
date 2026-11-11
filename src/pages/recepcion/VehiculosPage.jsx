import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'
import FormField from '@/components/ui/FormField'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import { useVehiculos } from '@/hooks/clientes/useVehiculos'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useAuth } from '@/hooks/core/useAuth'
import { estaAbierta } from '@/lib/constants/estados'
import { formatFecha } from '@/lib/format'
import { rutaOrden } from '@/routes/paths'

const PAGE = 20

export default function VehiculosPage() {
  const base = useBasePath()
  const { rol } = useAuth()
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [page, setPage] = useState(0)
  const { vehiculos, total, loading, error, refetch } = useVehiculos({ texto, page, pageSize: PAGE })

  return (
    <>
      <PageHeader
        titulo="Vehículos"
        subtitulo={total != null ? `${total} vehículo(s)` : undefined}
        acciones={
          <Button variant="primary" to={`${base}/registro`}>
            Registrar ingreso
          </Button>
        }
      />
      <Card className="filters">
        <FormField label="Buscar por patente, marca o modelo" htmlFor="buscar-veh">
          <SearchInput
            id="buscar-veh"
            placeholder="ABCD12, Toyota, Yaris…"
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
          rows={vehiculos}
          emptyMessage={texto ? `Sin resultados para “${texto}”` : 'Aún no hay vehículos registrados'}
          onRowClick={(v) => navigate(`${base}/vehiculos/${v.id}`)}
          columns={[
            { key: 'patente', header: 'Patente', render: (v) => <strong className="patente">{v.patente}</strong> },
            { key: 'vehiculo', header: 'Vehículo', render: (v) => `${v.marca} ${v.modelo} ${v.anio}` },
            { key: 'cliente', header: 'Cliente', render: (v) => v.clientes?.nombre },
            { key: 'telefono', header: 'Teléfono', render: (v) => v.clientes?.telefono },
            {
              key: 'ultima',
              header: 'Última visita',
              render: (v) => {
                const o = v.ordenes_trabajo?.[0]
                if (!o) return <span className="muted">Sin visitas</span>
                return (
                  <span className="row-wrap">
                    {formatFecha(o.fecha_ingreso)} {estaAbierta(o.estado) && <EstadoBadge estado={o.estado} />}
                  </span>
                )
              },
            },
            {
              key: 'acc',
              header: '',
              align: 'right',
              render: (v) => {
                const o = v.ordenes_trabajo?.[0]
                const abierta = o && estaAbierta(o.estado)
                return (
                  <span className="row-wrap row-end" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" to={`${base}/vehiculos/${v.id}`}>
                      Ficha
                    </Button>
                    {abierta ? (
                      <Button size="sm" variant="ghost" to={rutaOrden(rol, o.id)}>
                        Ver orden
                      </Button>
                    ) : (
                      <Button size="sm" variant="primary" to={`${base}/ordenes/nueva/${v.id}`}>
                        Crear orden
                      </Button>
                    )}
                  </span>
                )
              },
            },
          ]}
        />
        <Pagination page={page} pageSize={PAGE} total={total} onChange={setPage} />
      </Card>
    </>
  )
}
