import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ClienteForm from './ClienteForm'
import { useGuardarCliente } from '@/hooks/clientes/useClientes'
import { useToast } from '@/hooks/core/useToast'
import { formatearRut } from '@/lib/rut'
import { sinErrores, validarCliente } from '@/lib/validaciones'

// CU-01 FA: actualizar la información de contacto de un cliente existente
export default function ClienteEditModal({ cliente, onClose, onGuardado }) {
  const toast = useToast()
  const { actualizar, pending } = useGuardarCliente()
  const [f, setF] = useState({ rut: '', nombre: '', telefono: '', correo: '' })
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (cliente) setF({ rut: formatearRut(cliente.rut), nombre: cliente.nombre, telefono: cliente.telefono, correo: cliente.correo ?? '' })
    setErrores({})
  }, [cliente])

  const guardar = async () => {
    const e = validarCliente(f, { conRut: false })
    setErrores(e)
    if (!sinErrores(e)) return
    const r = await actualizar(cliente.id, f)
    if (!r.ok) return toast.error(r.error)
    toast.success('Datos del cliente actualizados')
    onGuardado?.(r.data)
    onClose()
  }

  return (
    <Modal
      open={Boolean(cliente)}
      titulo="Editar cliente"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={pending} onClick={guardar}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <ClienteForm value={f} onChange={setF} errores={errores} rutBloqueado rutAyuda="El RUT no se puede cambiar." idPrefix="edit-cli" />
    </Modal>
  )
}
