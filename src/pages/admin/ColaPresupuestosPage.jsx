import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import Select from '@/components/ui/Select'
import TextArea from '@/components/ui/TextArea'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import OrdenesTable from '@/components/domain/ordenes/OrdenesTable'
import { usePanelOrdenes } from '@/hooks/ordenes/usePanelOrdenes'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useCambiarEstado } from '@/hooks/ordenes/useCambiarEstado'
import { useConfirm } from '@/hooks/core/useConfirm'
import { useToast } from '@/hooks/core/useToast'
import { presupuestosService } from '@/services/presupuestosService'
import { traducirError } from '@/lib/errors'
import { formatCLP, formatFechaHora } from '@/lib/format'

const TABS = [
  { value: 'armar', label: 'Por armar', estado: 'diagnosticado' },
  { value: 'esperando', label: 'Esperando respuesta', estado: 'esperando_aprobacion' },
  { value: 'rechazados', label: 'Rechazados', estado: 'presupuesto_rechazado' },
]

function RespuestaModal({ orden, presupuesto, onClose, onListo }) {
  const [aprobar, setAprobar] = useState('si')
  const [via, setVia] = useState('telefono')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const toast = useToast()

  const guardar = async () => {
    if (aprobar === 'no' && !motivo.trim()) return setError('El motivo del rechazo es obligatorio (RF35).')
    setPending(true)
    const { error: e } = await presupuestosService.registrarRespuesta(presupuesto.id, aprobar === 'si', motivo.trim(), via)
    setPending(false)
    if (e) return setError(traducirError(e))
    toast.success(aprobar === 'si' ? 'Presupuesto aprobado' : 'Presupuesto rechazado')
    onListo()
  }

  return (
    <Modal
      open={Boolean(orden)}
      titulo={`Respuesta del cliente · ${orden?.patente}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={pending} onClick={guardar}>
            Registrar respuesta
          </Button>
        </>
      }
    >
      <div className="stack">
        <p>
          Presupuesto v{presupuesto?.version} por <strong>{formatCLP(presupuesto?.total)}</strong>, publicado {formatFechaHora(presupuesto?.publicado_en)}.
        </p>
        <FormField label="Respuesta" htmlFor="resp">
          <Select
            id="resp"
            value={aprobar}
            onChange={(e) => setAprobar(e.target.value)}
            options={[
              { value: 'si', label: 'Aprobó el presupuesto' },
              { value: 'no', label: 'Rechazó el presupuesto' },
            ]}
          />
        </FormField>
        <FormField label="Medio" htmlFor="via">
          <Select
            id="via"
            value={via}
            onChange={(e) => setVia(e.target.value)}
            options={[
              { value: 'telefono', label: 'Teléfono' },
              { value: 'presencial', label: 'En persona' },
            ]}
          />
        </FormField>
        {aprobar === 'no' && (
          <FormField label="Motivo del rechazo" htmlFor="motivo" required error={error}>
            <TextArea id="motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </FormField>
        )}
        {error && aprobar === 'si' && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

export default function ColaPresupuestosPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'armar'
  const def = TABS.find((t) => t.value === tab) ?? TABS[0]
  const navigate = useNavigate()
  const toast = useToast()
  const { confirm, dialogProps } = useConfirm()
  const { cambiarEstado } = useCambiarEstado()
  const [respondiendo, setRespondiendo] = useState(null)

  const todas = usePanelOrdenes({ estados: TABS.map((t) => t.estado), orden: { col: 'updated_at', asc: true } })
  const ordenes = todas.ordenes.filter((o) => o.estado === def.estado)
  const ids = ordenes.map((o) => o.id)

  const estadoPres = tab === 'esperando' ? 'publicado' : tab === 'rechazados' ? 'rechazado' : null
  const pres = useSupabaseQuery(() => presupuestosService.ultimoPorEstado(ids, estadoPres), [estadoPres, ids.join(',')], {
    enabled: Boolean(estadoPres && ids.length),
    initialData: [],
  })
  const presDe = (ordenId) => pres.data?.find((p) => p.orden_id === ordenId)

  const transicion = async (o, destino, nota, mensaje, ir) => {
    const ok = await confirm({ titulo: mensaje.titulo, mensaje: mensaje.texto, confirmarTexto: mensaje.boton })
    if (!ok) return
    const r = await cambiarEstado(o.id, destino, nota)
    if (!r.ok) return toast.error(r.error)
    toast.success('Orden actualizada')
    todas.refetch({ silencioso: true })
    if (ir) navigate(ir)
  }

  const accion = (o) => {
    if (tab === 'armar')
      return (
        <Button size="sm" variant="primary" to={`/admin/ordenes/${o.id}/presupuesto`}>
          Armar presupuesto
        </Button>
      )
    if (tab === 'esperando')
      return (
        <Button size="sm" onClick={() => setRespondiendo(o)} disabled={!presDe(o.id)}>
          Registrar respuesta
        </Button>
      )
    return (
      <div className="row-wrap">
        <Button
          size="sm"
          variant="primary"
          onClick={() =>
            transicion(o, 'diagnosticado', 'Renegociación del presupuesto', { titulo: 'Renegociar', texto: 'La orden vuelve a Diagnosticado para armar una nueva versión del presupuesto.', boton: 'Renegociar' }, `/admin/ordenes/${o.id}/presupuesto`)
          }
        >
          Renegociar
        </Button>
        <Button
          size="sm"
          onClick={() =>
            transicion(o, 'listo_entrega', 'Devolución sin reparar por presupuesto rechazado', { titulo: 'Devolver sin reparar', texto: 'La orden pasa a Listo para Entrega para que el cliente retire el vehículo.', boton: 'Devolver' })
          }
        >
          Devolver sin reparar
        </Button>
      </div>
    )
  }

  const extra =
    tab === 'armar'
      ? []
      : [
          { key: 'total', header: 'Total', align: 'right', render: (o) => formatCLP(presDe(o.id)?.total) },
          ...(tab === 'rechazados' ? [{ key: 'motivo', header: 'Motivo', render: (o) => presDe(o.id)?.motivo_rechazo ?? '—' }] : []),
        ]

  return (
    <>
      <PageHeader titulo="Presupuestos" subtitulo="CU-09 · revisar, publicar y seguir la respuesta del cliente" />
      <Tabs
        value={tab}
        onChange={(v) => setParams({ tab: v }, { replace: true })}
        tabs={TABS.map((t) => ({ value: t.value, label: t.label, badge: todas.ordenes.filter((o) => o.estado === t.estado).length }))}
      />
      <Card padding={false}>
        <OrdenesTable ordenes={ordenes} loading={todas.loading} error={todas.error} onRetry={todas.refetch} emptyMessage="No hay órdenes en este grupo" accion={accion} columnasExtra={extra} />
      </Card>
      {respondiendo && (
        <RespuestaModal
          orden={respondiendo}
          presupuesto={presDe(respondiendo.id)}
          onClose={() => setRespondiendo(null)}
          onListo={() => {
            setRespondiendo(null)
            todas.refetch({ silencioso: true })
          }}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </>
  )
}
