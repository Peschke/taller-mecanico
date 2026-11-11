import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import FormField from '@/components/ui/FormField'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Skeleton from '@/components/ui/Skeleton'
import AuditoriaDiff from '@/components/domain/auditoria/AuditoriaDiff'
import { useAuditoria, useNombresPersonal } from '@/hooks/admin/useAuditoria'
import { useToast } from '@/hooks/core/useToast'
import { ordenesService } from '@/services/ordenesService'
import { TABLAS_AUDITADAS } from '@/services/auditoriaService'
import { formatFechaHora } from '@/lib/format'
import { limitesDia } from '@/lib/fechas'

const PAGE = 25

// RNF12 · fecha, hora y usuario responsable de cada modificación
export default function AuditoriaPage() {
  const toast = useToast()
  const nombres = useNombresPersonal()
  const [filtros, setFiltros] = useState({})
  const [form, setForm] = useState({ tabla: '', accion: '', usuarioId: '', codigo: '', desde: '', hasta: '' })
  const [page, setPage] = useState(0)
  const [abierta, setAbierta] = useState(null)
  const { filas, total, loading, error, refetch } = useAuditoria(filtros, { page, pageSize: PAGE })

  const aplicar = async (e) => {
    e.preventDefault()
    let ordenId
    if (form.codigo.trim()) {
      const { data } = await ordenesService.obtenerPorCodigo(form.codigo)
      if (!data) return toast.error(`No existe la orden ${form.codigo.trim().toUpperCase()}`)
      ordenId = data.id
    }
    setFiltros({
      tabla: form.tabla || undefined,
      accion: form.accion || undefined,
      usuarioId: form.usuarioId || undefined,
      ordenId,
      desde: form.desde ? limitesDia(form.desde).desde : undefined,
      hasta: form.hasta ? limitesDia(form.hasta).hasta : undefined,
    })
    setPage(0)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <PageHeader titulo="Auditoría" subtitulo={total != null ? `${total} registro(s)` : undefined} />
      <Card className="filters">
        <form className="filters__row" onSubmit={aplicar}>
          <FormField label="Tabla" htmlFor="a-tabla">
            <Select id="a-tabla" value={form.tabla} onChange={set('tabla')} placeholder="Todas" options={TABLAS_AUDITADAS.map((t) => ({ value: t, label: t }))} />
          </FormField>
          <FormField label="Acción" htmlFor="a-acc">
            <Select
              id="a-acc"
              value={form.accion}
              onChange={set('accion')}
              placeholder="Todas"
              options={['INSERT', 'UPDATE', 'DELETE'].map((a) => ({ value: a, label: a }))}
            />
          </FormField>
          <FormField label="Usuario" htmlFor="a-user">
            <Select
              id="a-user"
              value={form.usuarioId}
              onChange={set('usuarioId')}
              placeholder="Todos"
              options={Object.entries(nombres).map(([id, n]) => ({ value: id, label: n }))}
            />
          </FormField>
          <FormField label="Código de orden" htmlFor="a-cod">
            <Input id="a-cod" placeholder="OT-2026-000001" value={form.codigo} onChange={set('codigo')} />
          </FormField>
          <FormField label="Desde" htmlFor="a-desde">
            <Input id="a-desde" type="date" value={form.desde} onChange={set('desde')} />
          </FormField>
          <FormField label="Hasta" htmlFor="a-hasta">
            <Input id="a-hasta" type="date" value={form.hasta} onChange={set('hasta')} />
          </FormField>
          <Button type="submit" variant="primary">
            Filtrar
          </Button>
        </form>
      </Card>

      {error ? (
        <ErrorState mensaje={error} onRetry={refetch} />
      ) : (
        <Card padding={false}>
          {loading && !filas.length ? (
            <div className="pad stack">
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
            </div>
          ) : !filas.length ? (
            <EmptyState mensaje="Sin registros para estos filtros" />
          ) : (
            <ul className="list">
              {filas.map((a) => (
                <li key={a.id} className="list__item list__item--block">
                  <button type="button" className="audit-row" onClick={() => setAbierta(abierta === a.id ? null : a.id)} aria-expanded={abierta === a.id}>
                    <span className="muted small">{formatFechaHora(a.created_at)}</span>
                    <Badge tono={a.accion === 'DELETE' ? 'danger' : a.accion === 'INSERT' ? 'success' : 'info'}>{a.accion}</Badge>
                    <code className="code">{a.tabla}</code>
                    <span>{nombres[a.usuario_id] ?? (a.rol === 'sistema' ? 'Sistema' : a.rol)}</span>
                    {a.orden_id && (
                      <Link to={`/admin/ordenes/${a.orden_id}`} onClick={(e) => e.stopPropagation()}>
                        Ver orden
                      </Link>
                    )}
                    <span className="audit-row__chev" aria-hidden="true">
                      {abierta === a.id ? '▴' : '▾'}
                    </span>
                  </button>
                  {abierta === a.id && <AuditoriaDiff antes={a.datos_antes} despues={a.datos_despues} />}
                </li>
              ))}
            </ul>
          )}
          <Pagination page={page} pageSize={PAGE} total={total} onChange={setPage} />
        </Card>
      )}
    </>
  )
}
