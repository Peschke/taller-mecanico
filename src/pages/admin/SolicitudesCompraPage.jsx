import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import Select from '@/components/ui/Select'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import MovimientoForm from '@/components/domain/inventario/MovimientoForm'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import { useSolicitudesCompra } from '@/hooks/taller/useSolicitudesCompra'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { useConfirm } from '@/hooks/core/useConfirm'
import { useToast } from '@/hooks/core/useToast'
import { useCambiarEstado } from '@/hooks/ordenes/useCambiarEstado'
import { solicitudesService } from '@/services/solicitudesService'
import { inventarioService } from '@/services/inventarioService'
import { ESTADOS_SOLICITUD } from '@/lib/constants/enums'
import { etiquetaEstado } from '@/lib/constants/estados'
import { traducirError } from '@/lib/errors'
import { formatFechaHora } from '@/lib/format'

const TABS = ['pendiente', 'aprobada', 'comprada', 'recibida', 'cancelada']

// RF17 · requerimientos de compra creados por los mecánicos (CU-06 FA)
export default function SolicitudesCompraPage() {
  const [params, setParams] = useSearchParams()
  const estado = params.get('estado') ?? 'pendiente'
  const toast = useToast()
  const { confirm, dialogProps } = useConfirm()
  const { getTransiciones } = useCatalogos()
  const { cambiarEstado } = useCambiarEstado()
  const { solicitudes, loading, error, refetch } = useSolicitudesCompra({ estado })
  const conteo = useSupabaseQuery(() => solicitudesService.contarPorEstado(), [estado, solicitudes.length], { initialData: {} })

  const [recibiendo, setRecibiendo] = useState(null)
  const [repuestoElegido, setRepuestoElegido] = useState('')
  const [devolver, setDevolver] = useState(null)
  const [destino, setDestino] = useState('')
  const [pending, setPending] = useState(false)

  const repuestos = useSupabaseQuery(() => inventarioService.listarRepuestos({ rango: [0, 499] }), [], { initialData: [] })
  const repuestoParaRecibir = recibiendo?.repuestos ?? repuestos.data?.find((r) => r.id === repuestoElegido) ?? null

  const recargar = () => {
    refetch({ silencioso: true })
    conteo.refetch({ silencioso: true })
  }

  const cambiar = async (s, nuevo, titulo) => {
    const ok = await confirm({ titulo, mensaje: `La solicitud quedará como "${ESTADOS_SOLICITUD[nuevo]}".`, confirmarTexto: titulo, peligro: nuevo === 'cancelada' })
    if (!ok) return
    const { error: e } = await solicitudesService.actualizar(s.id, { estado: nuevo })
    if (e) return toast.error(traducirError(e))
    toast.success('Solicitud actualizada')
    recargar()
  }

  const registrarRecepcion = async (mov) => {
    setPending(true)
    // Si la solicitud era de un repuesto fuera de catálogo, se vincula primero al repuesto elegido
    if (!recibiendo.repuesto_id) {
      const { error: e } = await solicitudesService.actualizar(recibiendo.id, { repuesto_id: repuestoParaRecibir.id })
      if (e) {
        setPending(false)
        return { ok: false, error: traducirError(e) }
      }
    }
    const { data, error: e } = await inventarioService.registrarMovimiento({ ...mov, repuesto_id: repuestoParaRecibir.id, solicitud_id: recibiendo.id })
    setPending(false)
    if (e) return { ok: false, error: traducirError(e) }
    toast.success(`Mercadería recibida. Stock: ${data.stock_resultante} u.`)
    const orden = recibiendo.ordenes_trabajo
    setRecibiendo(null)
    setRepuestoElegido('')
    recargar()
    if (orden?.estado === 'esperando_repuesto') {
      setDevolver(orden)
      setDestino('')
    }
    return { ok: true }
  }

  const opcionesDevolver = devolver ? getTransiciones('esperando_repuesto', 'admin').filter((t) => t.destino !== 'cancelada') : []

  const confirmarDevolver = async () => {
    if (!destino) return
    const r = await cambiarEstado(devolver.id, destino, 'Repuesto recibido')
    if (!r.ok) return toast.error(r.error)
    toast.success(`Orden ${devolver.codigo} en ${etiquetaEstado(destino)}`)
    setDevolver(null)
  }

  const acciones = (s) => {
    switch (s.estado) {
      case 'pendiente':
        return (
          <>
            <Button size="sm" variant="primary" onClick={() => cambiar(s, 'aprobada', 'Aprobar')}>
              Aprobar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => cambiar(s, 'cancelada', 'Cancelar')}>
              Cancelar
            </Button>
          </>
        )
      case 'aprobada':
        return (
          <>
            <Button size="sm" onClick={() => cambiar(s, 'comprada', 'Marcar comprada')}>
              Marcar comprada
            </Button>
            <Button size="sm" variant="primary" onClick={() => setRecibiendo(s)}>
              Recibir
            </Button>
          </>
        )
      case 'comprada':
        return (
          <Button size="sm" variant="primary" onClick={() => setRecibiendo(s)}>
            Recibir
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <>
      <PageHeader titulo="Solicitudes de compra" subtitulo="Repuestos pedidos por el taller cuando no hay stock" />
      <Tabs
        value={estado}
        onChange={(v) => setParams({ estado: v }, { replace: true })}
        tabs={TABS.map((t) => ({ value: t, label: ESTADOS_SOLICITUD[t], badge: conteo.data?.[t] ?? 0 }))}
      />
      <Card padding={false}>
        <DataTable
          loading={loading}
          error={error}
          onRetry={refetch}
          rows={solicitudes}
          emptyMessage="Sin solicitudes en este estado"
          columns={[
            { key: 'fecha', header: 'Fecha', render: (s) => formatFechaHora(s.created_at) },
            {
              key: 'repuesto',
              header: 'Repuesto',
              render: (s) =>
                s.repuestos ? (
                  <Link to={`/admin/inventario/${s.repuestos.id}`}>
                    {s.repuestos.nombre} <span className="muted">({s.repuestos.codigo})</span>
                  </Link>
                ) : (
                  <span>
                    {s.descripcion_repuesto} <span className="muted">(fuera de catálogo)</span>
                  </span>
                ),
            },
            { key: 'cantidad', header: 'Cant.', align: 'right' },
            { key: 'stock', header: 'Stock actual', align: 'right', render: (s) => s.repuestos?.stock ?? '—' },
            {
              key: 'orden',
              header: 'Orden',
              render: (s) =>
                s.ordenes_trabajo ? (
                  <span className="row-wrap">
                    <Link to={`/admin/ordenes/${s.ordenes_trabajo.id}`}>{s.ordenes_trabajo.codigo}</Link>
                    <EstadoBadge estado={s.ordenes_trabajo.estado} />
                  </span>
                ) : (
                  '—'
                ),
            },
            { key: 'solicitante', header: 'Solicitó', render: (s) => s.solicitante?.nombre_completo ?? '—' },
            { key: 'acc', header: '', align: 'right', render: (s) => <span className="row-wrap">{acciones(s)}</span> },
          ]}
        />
      </Card>

      {recibiendo && !recibiendo.repuesto_id && !repuestoElegido && (
        <Modal open titulo="¿Qué repuesto del catálogo llegó?" onClose={() => setRecibiendo(null)} size="sm">
          <div className="stack">
            <p>
              La solicitud pedía <strong>{recibiendo.descripcion_repuesto}</strong>, que no está en el catálogo. Elige el repuesto o créalo primero en Inventario.
            </p>
            <FormField label="Repuesto" htmlFor="rep-recibir">
              <Select
                id="rep-recibir"
                value={repuestoElegido}
                onChange={(e) => setRepuestoElegido(e.target.value)}
                placeholder="Selecciona…"
                options={(repuestos.data ?? []).map((r) => ({ value: r.id, label: `${r.codigo} · ${r.nombre}` }))}
              />
            </FormField>
            <Button to="/admin/inventario/nuevo">Crear repuesto</Button>
          </div>
        </Modal>
      )}

      <MovimientoForm
        open={Boolean(recibiendo && repuestoParaRecibir)}
        modo="entrada"
        repuesto={repuestoParaRecibir}
        solicitudInicial={recibiendo}
        onClose={() => {
          setRecibiendo(null)
          setRepuestoElegido('')
        }}
        onSubmit={registrarRecepcion}
        pending={pending}
      />

      <Modal
        open={Boolean(devolver)}
        titulo={`Repuesto recibido · ${devolver?.codigo ?? ''}`}
        onClose={() => setDevolver(null)}
        size="sm"
        footer={
          <>
            <Button onClick={() => setDevolver(null)}>Ahora no</Button>
            <Button variant="primary" disabled={!destino} onClick={confirmarDevolver}>
              Devolver orden
            </Button>
          </>
        }
      >
        <div className="stack">
          <p>La orden sigue en Esperando Repuesto. ¿A qué estado vuelve?</p>
          <FormField label="Nuevo estado" htmlFor="destino-dev">
            <Select
              id="destino-dev"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Selecciona…"
              options={opcionesDevolver.map((t) => ({ value: t.destino, label: etiquetaEstado(t.destino) }))}
            />
          </FormField>
        </div>
      </Modal>
      <ConfirmDialog {...dialogProps} />
    </>
  )
}
