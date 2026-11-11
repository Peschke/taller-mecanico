import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ProgressBar from '@/components/ui/ProgressBar'
import FichaClienteVehiculo from '@/components/domain/clientes/FichaClienteVehiculo'
import OrdenIngresoForm from '@/components/domain/ordenes/OrdenIngresoForm'
import OrdenTicket from '@/components/domain/ordenes/OrdenTicket'
import FotoUploader from '@/components/domain/fotos/FotoUploader'
import AsignarMecanicoModal from '@/components/domain/ordenes/AsignarMecanicoModal'
import { useVehiculoParaOrden, useCrearOrden } from '@/hooks/recepcion/useOrdenesRecepcion'
import { useSubirFotos } from '@/hooks/ordenes/useSubirFotos'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useAuth } from '@/hooks/core/useAuth'
import { useConfirm } from '@/hooks/core/useConfirm'
import { useToast } from '@/hooks/core/useToast'
import { sinErrores, validarOrden } from '@/lib/validaciones'
import { formatKm } from '@/lib/format'
import { imprimirPDF } from '@/lib/exportar'
import { rutaOrden } from '@/routes/paths'

const VACIO = { kilometraje: '', nivel_combustible: '', motivo_ingreso: '', observaciones_ingreso: '' }

// CU-02 · RF04, RF05, RF06, RF07
export default function NuevaOrdenPage() {
  const { vehiculoId } = useParams()
  const base = useBasePath()
  const { rol } = useAuth()
  const toast = useToast()
  const { confirm, dialogProps } = useConfirm()
  const datos = useVehiculoParaOrden(vehiculoId)
  const { crearOrden, pending } = useCrearOrden()
  const fotos = useSubirFotos()
  const [form, setForm] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [creada, setCreada] = useState(null)
  const [asignar, setAsignar] = useState(false)

  if (datos.loading && !datos.data) return <SplashScreen />
  if (datos.error) return <ErrorState mensaje={datos.error} onRetry={datos.refetch} />
  const v = datos.data?.vehiculo
  if (!v) return <EmptyState mensaje="Vehículo no encontrado" accion={<Button to={`${base}/registro`}>Registrar ingreso</Button>} />
  const ultimoKm = datos.data.ultimo?.kilometraje

  const generar = async (e) => {
    e.preventDefault()
    const err = validarOrden(form)
    setErrores(err)
    if (!sinErrores(err)) return toast.error('Completa los campos obligatorios.')
    if (ultimoKm != null && Number(form.kilometraje) < Number(ultimoKm)) {
      const ok = await confirm({
        titulo: 'Kilometraje menor al anterior',
        mensaje: `Ingresaste ${formatKm(form.kilometraje)}, pero la última visita registró ${formatKm(ultimoKm)}. ¿Es correcto?`,
        confirmarTexto: 'Sí, es correcto',
      })
      if (!ok) return
    }
    const r = await crearOrden({ ...form, vehiculo_id: v.id, cliente_id: v.cliente_id })
    if (!r.ok) {
      if (r.error.includes('Ya existe')) {
        toast.error('Este vehículo ya tiene una orden abierta.')
        datos.refetch()
      } else toast.error(r.error)
      return
    }
    setCreada({ orden: r.data, ingreso: { ...form } })
    toast.success(`Orden ${r.data.codigo} creada`)
    // RNF07: las fotos suben en segundo plano mientras se muestra el comprobante
    if (fotos.items.length) {
      fotos.subirTodas(r.data.id, 'ingreso').then((res) => {
        if (res.ok) toast.success('Fotos subidas')
        else toast.error(`${res.fallidas} foto(s) no se pudieron subir. Reintenta desde aquí.`)
      })
    }
  }

  if (creada) {
    const pendientes = fotos.items.filter((i) => i.estado === 'error').length
    return (
      <>
        <Breadcrumbs items={[{ label: 'Vehículos', to: `${base}/vehiculos` }, { label: v.patente, to: `${base}/vehiculos/${v.id}` }, { label: creada.orden.codigo }]} />
        <PageHeader
          titulo="Orden generada"
          subtitulo="Estado: Por Asignar · publicada en el panel"
          acciones={
            <Button onClick={() => imprimirPDF(`Orden ${creada.orden.codigo}`)} className="no-print">
              Imprimir comprobante
            </Button>
          }
        />
        <div className="layout-aside">
          <Card>
            <OrdenTicket orden={creada.orden} vehiculo={v} cliente={v.clientes} ingreso={creada.ingreso} />
          </Card>
          <aside className="stack no-print">
            <Card titulo="Siguiente paso">
              <div className="stack">
                <Button variant="primary" onClick={() => setAsignar(true)} block>
                  Asignar mecánico
                </Button>
                <Button to={rutaOrden(rol, creada.orden.id)} block>
                  Ver la orden
                </Button>
                <Button variant="ghost" to={`${base}/registro`} block>
                  Registrar otro ingreso
                </Button>
              </div>
            </Card>
            {fotos.items.length > 0 && (
              <Card titulo="Fotos">
                <ProgressBar value={fotos.progresoTotal} label="Progreso total de las fotos" />
                <FotoUploader items={fotos.items} onAgregar={fotos.agregar} onQuitar={fotos.quitar} bloqueado />
                {pendientes > 0 && !fotos.subiendo && (
                  <Button size="sm" onClick={() => fotos.subirTodas(creada.orden.id, 'ingreso')}>
                    Reintentar {pendientes} foto(s)
                  </Button>
                )}
              </Card>
            )}
          </aside>
        </div>
        <AsignarMecanicoModal
          open={asignar}
          orden={{ id: creada.orden.id, patente: v.patente, mecanico_id: null }}
          onClose={() => setAsignar(false)}
          onAsignado={() => toast.success('La orden pasó a Por Diagnosticar')}
        />
      </>
    )
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Vehículos', to: `${base}/vehiculos` }, { label: v.patente, to: `${base}/vehiculos/${v.id}` }, { label: 'Nueva orden' }]} />
      <PageHeader titulo="Crear orden de trabajo" subtitulo="CU-02 · Ingreso del vehículo al taller" />

      <Card className="section">
        <FichaClienteVehiculo vehiculo={v} base={base} />
      </Card>

      {datos.data.ordenAbierta ? (
        <Card>
          <EmptyState
            mensaje={`Este vehículo ya tiene la orden ${datos.data.ordenAbierta.codigo} abierta`}
            detalle="Solo puede haber una orden abierta por vehículo."
            accion={<Button to={rutaOrden(rol, datos.data.ordenAbierta.id)}>Ver orden abierta</Button>}
          />
        </Card>
      ) : (
        <form onSubmit={generar} noValidate className="stack">
          <Card titulo="Datos de ingreso">
            <OrdenIngresoForm value={form} onChange={setForm} errores={errores} ultimoKm={ultimoKm} />
          </Card>
          <Card titulo="Fotografías del estado inicial (opcional)">
            <FotoUploader items={fotos.items} rechazos={fotos.rechazos} onAgregar={fotos.agregar} onQuitar={fotos.quitar} bloqueado={pending} />
          </Card>
          <div className="form-actions">
            <Button to={`${base}/vehiculos/${v.id}`}>Cancelar</Button>
            <Button type="submit" variant="primary" size="lg" loading={pending}>
              Generar orden
            </Button>
          </div>
        </form>
      )}
      <ConfirmDialog {...dialogProps} />
    </>
  )
}
