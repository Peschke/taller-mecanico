import { useEffect, useState } from 'react'
import FormField from '@/components/ui/FormField'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import MoneyInput from '@/components/ui/MoneyInput'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useConfirm } from '@/hooks/core/useConfirm'
import { METODOS_PAGO } from '@/lib/constants/enums'
import { formatCLP } from '@/lib/format'

// CU-11 · RF29 (método y comprobante) · RF30 (abono con saldo pendiente)
export default function PagoForm({ saldo, onSubmit, pending, deshabilitado }) {
  const [metodo, setMetodo] = useState('efectivo')
  const [monto, setMonto] = useState(saldo > 0 ? saldo : null)
  const [recibido, setRecibido] = useState(null)
  const [operacion, setOperacion] = useState('')
  const [errores, setErrores] = useState({})
  const { confirm, dialogProps } = useConfirm()

  useEffect(() => {
    setMonto(saldo > 0 ? saldo : null)
  }, [saldo])

  const vuelto = metodo === 'efectivo' && recibido && monto ? recibido - monto : 0

  const enviar = async (e) => {
    e.preventDefault()
    const err = {}
    if (!monto || monto <= 0) err.monto = 'Ingresa el monto.'
    else if (monto > saldo) err.monto = `No puede superar el saldo (${formatCLP(saldo)}).`
    if (metodo !== 'efectivo' && !operacion.trim()) err.operacion = 'El número de operación es obligatorio para este método.'
    if (metodo === 'efectivo' && recibido != null && recibido < monto) err.recibido = 'El monto recibido no puede ser menor al monto a pagar.'
    setErrores(err)
    if (Object.keys(err).length) return

    if (monto < saldo) {
      const ok = await confirm({
        titulo: 'Registrar abono',
        mensaje: `El monto es menor al total. Quedará un saldo pendiente de ${formatCLP(saldo - monto)} y la orden seguirá abierta.`,
        confirmarTexto: 'Registrar abono',
      })
      if (!ok) return
    }
    const r = await onSubmit({ monto, metodo, monto_recibido: recibido ?? monto, numero_operacion: operacion })
    if (r?.ok) {
      setRecibido(null)
      setOperacion('')
    }
  }

  return (
    <form className="stack" onSubmit={enviar} noValidate>
      <FormField label="Forma de pago" htmlFor="metodo" required>
        <Select id="metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)} options={METODOS_PAGO} />
      </FormField>
      <FormField label="Monto a pagar" htmlFor="monto" required error={errores.monto} hint={`Saldo pendiente: ${formatCLP(saldo)}`}>
        <MoneyInput id="monto" value={monto} onChange={setMonto} invalid={!!errores.monto} />
      </FormField>
      {metodo === 'efectivo' ? (
        <FormField label="Monto recibido" htmlFor="recibido" error={errores.recibido} hint={vuelto > 0 ? `Vuelto: ${formatCLP(vuelto)}` : 'Opcional, para calcular el vuelto.'}>
          <MoneyInput id="recibido" value={recibido} onChange={setRecibido} />
        </FormField>
      ) : (
        <FormField label="N° de operación / comprobante" htmlFor="operacion" required error={errores.operacion}>
          <Input id="operacion" value={operacion} onChange={(e) => setOperacion(e.target.value)} invalid={!!errores.operacion} />
        </FormField>
      )}
      <Button type="submit" variant="primary" size="lg" loading={pending} disabled={deshabilitado || saldo <= 0}>
        Procesar cobro
      </Button>
      <ConfirmDialog {...dialogProps} />
    </form>
  )
}
