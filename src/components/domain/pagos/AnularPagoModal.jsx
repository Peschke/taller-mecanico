import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import TextArea from '@/components/ui/TextArea'
import { formatCLP } from '@/lib/format'

// Un pago no se edita: se anula con motivo (CHECK pagos: anulado ⇒ motivo_anulacion)
export default function AnularPagoModal({ pago, onClose, onConfirm, pending }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    setMotivo('')
    setError(null)
  }, [pago])

  return (
    <Modal
      open={Boolean(pago)}
      titulo="Anular pago"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Volver</Button>
          <Button
            variant="danger"
            loading={pending}
            onClick={async () => {
              if (!motivo.trim()) return setError('El motivo es obligatorio.')
              const r = await onConfirm(pago.id, motivo)
              if (!r.ok) setError(r.error)
            }}
          >
            Anular pago
          </Button>
        </>
      }
    >
      <div className="stack">
        <p>
          Se anulará el pago de <strong>{formatCLP(pago?.monto)}</strong>. El saldo de la orden aumentará en ese monto.
        </p>
        <FormField label="Motivo" htmlFor="motivo-anulacion" required error={error}>
          <TextArea id="motivo-anulacion" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  )
}
