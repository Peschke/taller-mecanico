import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import VehiculoForm from './VehiculoForm'
import { useGuardarVehiculo } from '@/hooks/clientes/useVehiculos'
import { useToast } from '@/hooks/core/useToast'
import { sinErrores, validarVehiculo } from '@/lib/validaciones'

export default function VehiculoEditModal({ vehiculo, onClose, onGuardado }) {
  const toast = useToast()
  const { actualizar, pending } = useGuardarVehiculo()
  const [f, setF] = useState({ patente: '', marca: '', modelo: '', anio: '', color: '', vin: '' })
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (vehiculo)
      setF({ patente: vehiculo.patente, marca: vehiculo.marca, modelo: vehiculo.modelo, anio: String(vehiculo.anio), color: vehiculo.color ?? '', vin: vehiculo.vin ?? '' })
    setErrores({})
  }, [vehiculo])

  const guardar = async () => {
    const e = validarVehiculo(f, { conPatente: false })
    setErrores(e)
    if (!sinErrores(e)) return
    const r = await actualizar(vehiculo.id, f)
    if (!r.ok) return toast.error(r.error.includes('Ya existe') ? 'Ese VIN ya está registrado en otro vehículo.' : r.error)
    toast.success('Vehículo actualizado')
    onGuardado?.(r.data)
    onClose()
  }

  return (
    <Modal
      open={Boolean(vehiculo)}
      titulo={`Editar vehículo · ${vehiculo?.patente ?? ''}`}
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
      <VehiculoForm value={f} onChange={setF} errores={errores} idPrefix="edit-veh" />
    </Modal>
  )
}
