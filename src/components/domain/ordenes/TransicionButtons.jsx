import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import TextArea from '@/components/ui/TextArea'
import { useTransicionesDisponibles } from '@/hooks/ordenes/useTransicionesDisponibles'
import { useCambiarEstado } from '@/hooks/ordenes/useCambiarEstado'
import { useToast } from '@/hooks/core/useToast'
import { etiquetaEstado } from '@/lib/constants/estados'

// Botones generados desde transiciones_estado para el rol actual; llaman a cambiar_estado_orden
export default function TransicionButtons({ orden, onCambio, excluir = [], size = 'md' }) {
  const opciones = useTransicionesDisponibles(orden?.estado).filter((o) => !excluir.includes(o.destino))
  const { cambiarEstado, pending } = useCambiarEstado()
  const toast = useToast()
  const [activa, setActiva] = useState(null)
  const [nota, setNota] = useState('')
  const [error, setError] = useState(null)

  if (!opciones.length) return null

  const ejecutar = async (op, texto) => {
    const r = await cambiarEstado(orden.id, op.destino, texto)
    if (!r.ok) {
      setError(r.error)
      toast.error(r.error)
      return
    }
    toast.success(`Orden en estado ${etiquetaEstado(op.destino)}`)
    setActiva(null)
    setNota('')
    onCambio?.()
  }

  const abrir = (op) => {
    setError(null)
    setNota('')
    setActiva(op)
  }

  return (
    <>
      <div className="row-wrap">
        {opciones.map((op) => (
          <Button key={op.destino} size={size} variant={op.variant ?? 'secondary'} onClick={() => abrir(op)} disabled={pending}>
            {op.label}
          </Button>
        ))}
      </div>
      <Modal
        open={Boolean(activa)}
        titulo={activa?.label}
        onClose={() => setActiva(null)}
        footer={
          <>
            <Button onClick={() => setActiva(null)}>Volver</Button>
            <Button
              variant={activa?.peligro ? 'danger' : 'primary'}
              loading={pending}
              onClick={() => {
                if (activa.requiereNota && !nota.trim()) return setError(`${activa.notaLabel} es obligatorio.`)
                ejecutar(activa, nota.trim())
              }}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <div className="stack">
          <p>
            La orden <strong>{orden?.codigo}</strong> pasará de <strong>{etiquetaEstado(orden?.estado)}</strong> a{' '}
            <strong>{etiquetaEstado(activa?.destino)}</strong>.
          </p>
          <FormField label={activa?.notaLabel ?? 'Nota (opcional)'} htmlFor="nota-transicion" required={activa?.requiereNota} error={error}>
            <TextArea id="nota-transicion" rows={3} value={nota} onChange={(e) => setNota(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </>
  )
}
