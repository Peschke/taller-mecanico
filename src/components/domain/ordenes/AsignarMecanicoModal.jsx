import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Select from '@/components/ui/Select'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { useAsignarMecanico } from '@/hooks/ordenes/useAsignarMecanico'
import { useToast } from '@/hooks/core/useToast'

export default function AsignarMecanicoModal({ open, orden, onClose, onAsignado }) {
  const { mecanicos } = useCatalogos()
  const { asignar, pending } = useAsignarMecanico()
  const toast = useToast()
  const [mecanicoId, setMecanicoId] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setMecanicoId(orden?.mecanico_id ?? '')
      setError(null)
    }
  }, [open, orden])

  const guardar = async () => {
    if (!mecanicoId) return setError('Elige un mecánico.')
    const r = await asignar(orden.id, mecanicoId)
    if (!r.ok) return setError(r.error)
    toast.success('Mecánico asignado')
    onAsignado?.()
    onClose()
  }

  return (
    <Modal
      open={open}
      titulo={`Asignar mecánico · ${orden?.patente ?? orden?.vehiculos?.patente ?? ''}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={pending} onClick={guardar}>
            Asignar
          </Button>
        </>
      }
    >
      <FormField label="Mecánico" htmlFor="mecanico" required error={error}>
        <Select
          id="mecanico"
          value={mecanicoId}
          onChange={(e) => setMecanicoId(e.target.value)}
          placeholder="Selecciona…"
          options={mecanicos.map((m) => ({ value: m.id, label: m.nombre_completo }))}
        />
      </FormField>
      {!mecanicos.length && <p className="muted small">No hay mecánicos activos. Créalos en Usuarios.</p>}
    </Modal>
  )
}
