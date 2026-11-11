import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import Pagination from '@/components/ui/Pagination'
import FormField from '@/components/ui/FormField'
import OrdenesTable from '@/components/domain/ordenes/OrdenesTable'
import { usePanelOrdenes } from '@/hooks/ordenes/usePanelOrdenes'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { ESTADOS, ETAPAS } from '@/lib/constants/estados'

const PAGE = 25

export default function OrdenesAdminPage() {
  const [params, setParams] = useSearchParams()
  const { mecanicos } = useCatalogos()
  const [texto, setTexto] = useState('')
  const [page, setPage] = useState(0)

  const etapa = params.get('etapa') ?? ''
  const estado = params.get('estado') ?? ''
  const mecanico = params.get('mecanico') ?? ''
  const cerradas = params.get('cerradas') === '1'

  const estados = useMemo(() => {
    if (estado) return [estado]
    if (etapa) return Object.entries(ESTADOS).filter(([, v]) => v.etapa === etapa).map(([k]) => k)
    return undefined
  }, [estado, etapa])

  const filtros = {
    estados,
    excluirCerradas: !cerradas && !estado && etapa !== 'Entregado',
    mecanicoId: mecanico === 'sin' ? undefined : mecanico || undefined,
    sinAsignar: mecanico === 'sin',
    texto: texto || undefined,
    rango: [page * PAGE, page * PAGE + PAGE - 1],
    conteo: true,
  }
  const { ordenes, total, loading, error, refetch } = usePanelOrdenes(filtros)

  const setParam = (k, v) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    if (k === 'estado') p.delete('etapa')
    if (k === 'etapa') p.delete('estado')
    setParams(p, { replace: true })
    setPage(0)
  }

  return (
    <>
      <PageHeader titulo="Órdenes de trabajo" subtitulo={total != null ? `${total} resultado(s)` : undefined} />
      <Card className="filters">
        <div className="filters__row">
          <FormField label="Buscar" htmlFor="buscar-ot" className="grow">
            <SearchInput
              id="buscar-ot"
              placeholder="Patente, cliente o código"
              onSearch={(t) => {
                setTexto(t)
                setPage(0)
              }}
            />
          </FormField>
          <FormField label="Etapa" htmlFor="f-etapa">
            <Select id="f-etapa" value={etapa} onChange={(e) => setParam('etapa', e.target.value)} placeholder="Todas" options={ETAPAS.map((e) => ({ value: e, label: e }))} />
          </FormField>
          <FormField label="Estado" htmlFor="f-estado">
            <Select
              id="f-estado"
              value={estado}
              onChange={(e) => setParam('estado', e.target.value)}
              placeholder="Todos"
              options={Object.entries(ESTADOS).map(([k, v]) => ({ value: k, label: v.etiqueta }))}
            />
          </FormField>
          <FormField label="Mecánico" htmlFor="f-mec">
            <Select
              id="f-mec"
              value={mecanico}
              onChange={(e) => setParam('mecanico', e.target.value)}
              placeholder="Todos"
              options={[{ value: 'sin', label: 'Sin asignar' }, ...mecanicos.map((m) => ({ value: m.id, label: m.nombre_completo }))]}
            />
          </FormField>
          <Checkbox id="f-cerradas" label="Incluir cerradas y canceladas" checked={cerradas} onChange={(e) => setParam('cerradas', e.target.checked ? '1' : '')} />
        </div>
      </Card>
      <Card padding={false}>
        <OrdenesTable ordenes={ordenes} loading={loading} error={error} onRetry={refetch} />
        <Pagination page={page} pageSize={PAGE} total={total} onChange={setPage} />
      </Card>
    </>
  )
}
