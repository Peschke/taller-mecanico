import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import PresupuestoEditor from '@/components/domain/presupuesto/PresupuestoEditor'
import PresupuestoTotales from '@/components/domain/presupuesto/PresupuestoTotales'
import SaldoCard from '@/components/domain/pagos/SaldoCard'
import PagoForm from '@/components/domain/pagos/PagoForm'
import PagosList from '@/components/domain/pagos/PagosList'
import AnularPagoModal from '@/components/domain/pagos/AnularPagoModal'
import { useOrden } from '@/hooks/ordenes/useOrden'
import { usePresupuesto } from '@/hooks/finanzas/usePresupuesto'
import { useSaldo } from '@/hooks/finanzas/useSaldo'
import { usePagos } from '@/hooks/finanzas/usePagos'
import { useToast } from '@/hooks/core/useToast'
import { formatCLP } from '@/lib/format'
import { imprimirPDF } from '@/lib/exportar'

const ESTADOS_COBRABLES = ['presupuesto_aprobado', 'esperando_repuesto', 'en_reparacion', 'pruebas_ruta', 'trabajo_terminado', 'listo_entrega']

// CU-11 · Registrar pago y procesar cobro
export default function CobroOrdenPage() {
  const { ordenId } = useParams()
  const toast = useToast()
  const [anulando, setAnulando] = useState(null)
  const { orden, loading, error, refetch } = useOrden(ordenId)
  const pres = usePresupuesto(ordenId)
  const saldo = useSaldo(ordenId)
  const pagos = usePagos(ordenId, {
    onCambio: () => {
      saldo.refetch({ silencioso: true })
      refetch({ silencioso: true })
    },
  })

  if (loading && !orden) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!orden) return <EmptyState mensaje="Orden no encontrada" />

  const aprobado = pres.presupuestos.find((p) => p.estado === 'aprobado')
  const cobrable = ESTADOS_COBRABLES.includes(orden.estado)
  const saldoPendiente = Number(saldo.saldo?.saldo ?? 0)

  const registrar = async (datos) => {
    const r = await pagos.registrar(datos)
    if (!r.ok) {
      toast.error(r.error)
      return r
    }
    const cerro = datos.monto >= saldoPendiente && orden.estado === 'listo_entrega'
    toast.success(cerro ? 'Pago total registrado. La orden quedó Pagada y Cerrada.' : datos.monto < saldoPendiente ? 'Abono registrado' : 'Pago registrado')
    return r
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Caja', to: '/admin/caja' }, { label: orden.codigo, to: `/admin/ordenes/${orden.id}` }, { label: 'Cobro' }]} />
      <PageHeader
        titulo={`Cobro · ${orden.vehiculos?.patente}`}
        subtitulo={`${orden.clientes?.nombre} · ${orden.codigo}`}
        acciones={
          <Button onClick={() => imprimirPDF(`Cobro ${orden.codigo}`)} className="no-print">
            Imprimir comprobante
          </Button>
        }
      >
        <EstadoBadge estado={orden.estado} />
      </PageHeader>

      <div className="layout-aside">
        <div className="stack">
          <Card titulo={aprobado ? `Presupuesto aprobado · v${aprobado.version}` : 'Presupuesto'} padding={false}>
            {aprobado ? (
              <div className="pad stack">
                <PresupuestoEditor items={pres.actual?.id === aprobado.id ? pres.items : []} editable={false} mostrarCostos={false} />
                <PresupuestoTotales p={aprobado} mostrarCostos={false} />
              </div>
            ) : (
              <EmptyState mensaje="La orden no tiene un presupuesto aprobado" detalle="El total a cobrar es $0. Si se devuelve sin reparar, puedes cerrarla desde el detalle de la orden." />
            )}
          </Card>
          <Card titulo="Pagos registrados" padding={false}>
            <PagosList pagos={pagos.pagos} loading={pagos.loading} onAnular={setAnulando} />
          </Card>
        </div>
        <aside className="stack">
          <SaldoCard saldo={saldo.saldo} loading={saldo.loading} />
          <Card titulo="Registrar pago" className="no-print">
            {orden.estado === 'pagado_cerrado' ? (
              <EmptyState mensaje="Orden pagada y cerrada" compacto />
            ) : !cobrable ? (
              <EmptyState mensaje="Esta orden aún no se puede cobrar" detalle="Se cobra desde que el cliente aprueba el presupuesto." compacto />
            ) : saldoPendiente <= 0 ? (
              <EmptyState mensaje="Sin saldo pendiente" detalle={`Total pagado: ${formatCLP(saldo.saldo?.pagado)}`} compacto />
            ) : (
              <PagoForm saldo={saldoPendiente} onSubmit={registrar} pending={pagos.pending} />
            )}
          </Card>
        </aside>
      </div>

      <AnularPagoModal
        pago={anulando}
        pending={pagos.pending}
        onClose={() => setAnulando(null)}
        onConfirm={async (id, motivo) => {
          const r = await pagos.anular(id, motivo)
          if (r.ok) {
            toast.success('Pago anulado')
            setAnulando(null)
          }
          return r
        }}
      />
    </>
  )
}
