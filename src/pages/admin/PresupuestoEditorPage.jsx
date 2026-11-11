import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import MoneyInput from '@/components/ui/MoneyInput'
import TextArea from '@/components/ui/TextArea'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import PresupuestoEditor from '@/components/domain/presupuesto/PresupuestoEditor'
import PresupuestoTotales from '@/components/domain/presupuesto/PresupuestoTotales'
import { useOrden, useDetalleTecnico } from '@/hooks/ordenes/useOrden'
import { usePresupuesto } from '@/hooks/finanzas/usePresupuesto'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { useConfirm } from '@/hooks/core/useConfirm'
import { useToast } from '@/hooks/core/useToast'
import { ESTADOS_PRESUPUESTO } from '@/lib/constants/enums'
import { formatCLP, formatFechaHora } from '@/lib/format'

const TONO = { borrador: 'neutral', publicado: 'warning', aprobado: 'success', rechazado: 'danger', anulado: 'neutral' }

// CU-09: revisar diagnóstico, consolidar repuestos, asignar mano de obra, ajustar y publicar
export default function PresupuestoEditorPage() {
  const { ordenId } = useParams()
  const toast = useToast()
  const { confirm, dialogProps } = useConfirm()
  const { tareas: catalogoTareas } = useCatalogos()
  const { orden, loading, error, refetch } = useOrden(ordenId)
  const tecnico = useDetalleTecnico(ordenId)
  const pres = usePresupuesto(ordenId)
  const p = pres.actual
  const editable = p?.estado === 'borrador'

  // Sugerencia de mano de obra: suma de los valores de referencia de las tareas del catálogo usadas
  const sugerida = useMemo(() => {
    const ids = tecnico.data.tareas.map((t) => t.tarea_id).filter(Boolean)
    return catalogoTareas.filter((t) => ids.includes(t.id)).reduce((s, t) => s + Number(t.valor_mano_obra_ref ?? 0), 0)
  }, [tecnico.data.tareas, catalogoTareas])

  const [manoObra, setManoObra] = useState(null)
  const [descMO, setDescMO] = useState('Mano de obra')
  const [descuento, setDescuento] = useState(0)
  const [notas, setNotas] = useState('')
  const [errores, setErrores] = useState({})
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (manoObra == null && sugerida > 0) setManoObra(sugerida)
  }, [sugerida, manoObra])

  useEffect(() => {
    setDescuento(Number(p?.descuento ?? 0))
    setNotas(p?.notas ?? '')
  }, [p?.id, p?.descuento, p?.notas])

  if (loading && !orden) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!orden) return <EmptyState mensaje="Orden no encontrada" />

  const generar = async (e) => {
    e.preventDefault()
    if (manoObra == null || manoObra < 0) return setErrores({ manoObra: 'Ingresa el monto de mano de obra (RF23).' })
    setErrores({})
    setPending(true)
    const r = await pres.generar(manoObra, descMO)
    setPending(false)
    if (!r.ok) return toast.error(r.error)
    toast.success('Borrador creado con los repuestos de la orden')
  }

  const guardarAjustes = async () => {
    const subtotal = Number(p.total_repuestos) + Number(p.total_mano_obra) + Number(p.total_otros)
    if (descuento > subtotal) return setErrores({ descuento: 'El descuento no puede superar el subtotal.' })
    setErrores({})
    const r = await pres.actualizar({ descuento: descuento ?? 0, notas: notas.trim() || null })
    if (r.ok) toast.success('Ajustes guardados')
    else toast.error(r.error)
  }

  const publicar = async () => {
    const ok = await confirm({
      titulo: 'Publicar presupuesto',
      mensaje: `El cliente verá un total de ${formatCLP(p.total)} y podrá aprobarlo o rechazarlo. Después ya no se podrá editar.`,
      confirmarTexto: 'Publicar',
    })
    if (!ok) return
    setPending(true)
    const r = await pres.publicar()
    setPending(false)
    if (!r.ok) return toast.error(r.error)
    toast.success('Presupuesto publicado. La orden quedó Esperando Aprobación del cliente.')
    refetch({ silencioso: true })
  }

  const conResultado = async (promesa) => {
    const r = await promesa
    if (!r.ok) toast.error(r.error)
    return r
  }

  const puedeGenerar = orden.estado === 'diagnosticado' && !editable

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Presupuestos', to: '/admin/presupuestos' },
          { label: orden.codigo, to: `/admin/ordenes/${orden.id}` },
          { label: 'Presupuesto' },
        ]}
      />
      <PageHeader
        titulo={`Presupuesto · ${orden.vehiculos?.patente}`}
        subtitulo={`${orden.vehiculos?.marca} ${orden.vehiculos?.modelo} · ${orden.clientes?.nombre}`}
        acciones={
          editable && (
            <Button variant="primary" onClick={publicar} loading={pending} disabled={!pres.items.some((i) => i.tipo === 'mano_obra')}>
              Generar y publicar presupuesto
            </Button>
          )
        }
      >
        <div className="row-wrap">
          <EstadoBadge estado={orden.estado} />
          {p && (
            <Badge tono={TONO[p.estado]}>
              v{p.version} · {ESTADOS_PRESUPUESTO[p.estado]}
            </Badge>
          )}
        </div>
      </PageHeader>

      <div className="layout-aside">
        <div className="stack">
          <Card titulo="Evaluación del mecánico">
            {!tecnico.data.diagnosticos.length ? (
              <EmptyState mensaje="La orden no tiene diagnóstico" compacto />
            ) : (
              tecnico.data.diagnosticos.map((d) => (
                <p key={d.id}>
                  {d.descripcion} <span className="muted small">· {d.perfiles?.nombre_completo}</span>
                </p>
              ))
            )}
            {tecnico.data.tareas.length > 0 && (
              <ul className="checklist">
                {tecnico.data.tareas.map((t) => (
                  <li key={t.id}>○ {t.descripcion}</li>
                ))}
              </ul>
            )}
          </Card>

          {puedeGenerar && (
            <Card titulo={pres.presupuestos.length ? `Nueva versión (v${pres.presupuestos.length + 1})` : 'Armar presupuesto'}>
              <p className="muted small">
                Se agregarán automáticamente los {tecnico.data.repuestos.length} repuesto(s) asignados a la orden, con su precio de venta.
              </p>
              <form className="inline-form" onSubmit={generar}>
                <FormField label="Descripción" htmlFor="desc-mo" className="grow">
                  <Input id="desc-mo" value={descMO} onChange={(e) => setDescMO(e.target.value)} />
                </FormField>
                <FormField
                  label="Mano de obra"
                  htmlFor="mano-obra"
                  required
                  error={errores.manoObra}
                  hint={sugerida > 0 ? `Sugerido por catálogo: ${formatCLP(sugerida)}` : undefined}
                >
                  <MoneyInput id="mano-obra" value={manoObra} onChange={setManoObra} invalid={!!errores.manoObra} />
                </FormField>
                <Button type="submit" variant="primary" loading={pending}>
                  Crear borrador
                </Button>
              </form>
            </Card>
          )}

          {p ? (
            <Card titulo={editable ? 'Ítems (edita cantidad o precio y sal del campo para guardar)' : 'Ítems'} padding={false}>
              <div className="pad">
                <PresupuestoEditor
                  items={pres.items}
                  editable={editable}
                  onUpdateItem={(id, c) => conResultado(pres.actualizarItem(id, c))}
                  onDeleteItem={(id) => conResultado(pres.eliminarItem(id))}
                  onAddItem={(item) => pres.agregarItem(item)}
                />
              </div>
            </Card>
          ) : (
            !puedeGenerar && (
              <Card>
                <EmptyState
                  mensaje="Esta orden no tiene presupuesto"
                  detalle="Solo se puede armar cuando está en Diagnosticado / Esperando Presupuesto."
                />
              </Card>
            )
          )}
        </div>

        {p && (
          <aside className="stack">
            <Card titulo="Totales">
              <PresupuestoTotales p={p} />
            </Card>
            {editable ? (
              <Card titulo="Ajustes">
                <div className="stack">
                  <FormField label="Descuento" htmlFor="descuento" error={errores.descuento}>
                    <MoneyInput id="descuento" value={descuento} onChange={(v) => setDescuento(v ?? 0)} />
                  </FormField>
                  <FormField label="Notas internas" htmlFor="notas">
                    <TextArea id="notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
                  </FormField>
                  <Button onClick={guardarAjustes}>Guardar ajustes</Button>
                </div>
              </Card>
            ) : (
              <Card titulo="Estado">
                <dl className="dl">
                  <dt>Publicado</dt>
                  <dd>{formatFechaHora(p.publicado_en)}</dd>
                  <dt>Respondido</dt>
                  <dd>{p.respondido_en ? `${formatFechaHora(p.respondido_en)} (${p.respuesta_via})` : 'Pendiente'}</dd>
                  {p.motivo_rechazo && (
                    <>
                      <dt>Motivo</dt>
                      <dd>{p.motivo_rechazo}</dd>
                    </>
                  )}
                </dl>
                {p.estado === 'rechazado' && (
                  <p className="small">
                    Para renegociar, vuelve la orden a Diagnosticado desde <Link to="/admin/presupuestos?tab=rechazados">Presupuestos › Rechazados</Link>.
                  </p>
                )}
              </Card>
            )}
          </aside>
        )}
      </div>
      <ConfirmDialog {...dialogProps} />
    </>
  )
}
