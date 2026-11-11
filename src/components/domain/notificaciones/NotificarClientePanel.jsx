import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import CanalSelector from './CanalSelector'
import MensajePreview, { mensajeVehiculoListo } from './MensajePreview'
import NotificacionItem from './NotificacionItem'
import FichaClienteVehiculo from '@/components/domain/clientes/FichaClienteVehiculo'
import { useNotificacionesRecepcion, useAvisosCliente } from '@/hooks/recepcion/useNotificacionesRecepcion'
import { useToast } from '@/hooks/core/useToast'
import { etiquetaEstado } from '@/lib/constants/estados'

// +56 9 1234 5678 → 56912345678 (formato de wa.me)
export function telefonoWhatsApp(tel) {
  let d = String(tel ?? '').replace(/\D/g, '')
  if (d.length === 9 && d.startsWith('9')) d = `56${d}`
  if (d.length === 8) d = `569${d}`
  return d
}

/**
 * CU-03 · RF08 / RF09. orden: { id, codigo, codigo_seguimiento, estado, vehiculos{}, clientes{} }
 */
export default function NotificarClientePanel({ orden, canalInicial = 'email', onNotificado, base }) {
  const toast = useToast()
  const { enviarCorreo, registrarAvisoManual, pending } = useNotificacionesRecepcion()
  const cliente = orden?.clientes
  const sinCorreo = !cliente?.correo
  const [canal, setCanal] = useState(sinCorreo && canalInicial === 'email' ? 'whatsapp' : canalInicial)
  const [mensaje, setMensaje] = useState(() => mensajeVehiculoListo(orden))
  const [errorCorreo, setErrorCorreo] = useState(null)
  const [whatsappAbierto, setWhatsappAbierto] = useState(false)
  const [recarga, setRecarga] = useState(0)
  const avisos = useAvisosCliente(orden?.id, [recarga])

  useEffect(() => {
    setMensaje(mensajeVehiculoListo(orden))
  }, [orden])

  if (!orden) return null
  const yaListo = orden.estado !== 'trabajo_terminado'

  const exito = (texto) => {
    toast.success(texto)
    setRecarga((n) => n + 1)
    onNotificado?.()
  }

  const enviar = async () => {
    setErrorCorreo(null)
    if (!mensaje.trim()) return toast.error('El mensaje no puede estar vacío.')
    if (canal === 'email') {
      const r = await enviarCorreo({ ordenId: orden.id, clienteId: cliente.id, mensaje: mensaje.trim() })
      setRecarga((n) => n + 1)
      if (!r.ok) {
        // CU-03 FA: fallo de la plataforma → aviso y opción de llamada
        setErrorCorreo(r.error)
        return
      }
      return exito('Correo enviado. La orden quedó Lista para Entrega.')
    }
    if (canal === 'whatsapp') {
      if (!whatsappAbierto) {
        window.open(`https://wa.me/${telefonoWhatsApp(cliente.telefono)}?text=${encodeURIComponent(mensaje.trim())}`, '_blank', 'noopener')
        setWhatsappAbierto(true)
        return
      }
      const r = await registrarAvisoManual({ ordenId: orden.id, clienteId: cliente.id, canal: 'whatsapp', mensaje: mensaje.trim() })
      if (!r.ok) return toast.error(r.error)
      return exito('Aviso por WhatsApp registrado. La orden quedó Lista para Entrega.')
    }
    const r = await registrarAvisoManual({ ordenId: orden.id, clienteId: cliente.id, canal: 'llamada', mensaje: 'Notificado por llamada' })
    if (!r.ok) return toast.error(r.error)
    return exito('Llamada registrada. La orden quedó Lista para Entrega.')
  }

  const textoBoton =
    canal === 'email' ? 'Enviar correo' : canal === 'whatsapp' ? (whatsappAbierto ? 'Confirmar que se envió el WhatsApp' : 'Abrir WhatsApp') : 'Registrar llamada realizada'

  return (
    <div className="stack">
      <FichaClienteVehiculo vehiculo={orden.vehiculos} cliente={cliente} base={base} />
      {yaListo ? (
        <EmptyState mensaje={`La orden está en ${etiquetaEstado(orden.estado)}`} detalle="Solo se avisa al cliente cuando el trabajo está terminado." compacto />
      ) : (
        <>
          <CanalSelector value={canal} onChange={(c) => { setCanal(c); setErrorCorreo(null); setWhatsappAbierto(false) }} deshabilitados={{ email: sinCorreo ? 'El cliente no tiene correo' : null }} />
          {canal === 'llamada' ? (
            <p>
              Llama a <strong>{cliente.nombre}</strong> al <a href={`tel:${cliente.telefono}`}>{cliente.telefono}</a> y confirma cuando hayas hablado con el cliente.
            </p>
          ) : (
            <MensajePreview value={mensaje} onChange={setMensaje} />
          )}
          {errorCorreo && (
            <div className="error-state" role="alert">
              <p className="error-state__msg">No se pudo enviar el correo: {errorCorreo}</p>
              <p className="small">Avisa por teléfono y registra la llamada.</p>
              <Button size="sm" onClick={() => setCanal('llamada')}>
                Registrar aviso por llamada
              </Button>
            </div>
          )}
          {canal === 'whatsapp' && whatsappAbierto && <p className="small muted">Envía el mensaje en WhatsApp y luego confirma aquí.</p>}
          <Button variant="primary" size="lg" onClick={enviar} loading={pending} block>
            {textoBoton}
          </Button>
        </>
      )}
      {avisos.data?.length > 0 && (
        <div>
          <div className="lbl-sec">Avisos registrados</div>
          <ul className="list">
            {avisos.data.map((n) => (
              <NotificacionItem key={n.id} n={n} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
