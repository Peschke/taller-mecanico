import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import MoneyInput from '@/components/ui/MoneyInput'
import Select from '@/components/ui/Select'
import TextArea from '@/components/ui/TextArea'
import { formatCLP } from '@/lib/format'

/**
 * modo 'entrada': ingreso de mercadería (cantidad + costo, opcionalmente ligado a una solicitud).
 * modo 'ajuste': ajuste positivo o negativo con motivo obligatorio.
 */
export default function MovimientoForm({ open, modo, repuesto, solicitudes = [], onClose, onSubmit, pending, solicitudInicial }) {
  const [cantidad, setCantidad] = useState('')
  const [costo, setCosto] = useState(null)
  const [tipoAjuste, setTipoAjuste] = useState('ajuste_positivo')
  const [motivo, setMotivo] = useState('')
  const [solicitudId, setSolicitudId] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setCantidad(solicitudInicial ? String(solicitudInicial.cantidad) : '')
    setCosto(repuesto ? Number(repuesto.costo_promedio) || null : null)
    setTipoAjuste('ajuste_positivo')
    setMotivo('')
    setSolicitudId(solicitudInicial?.id ?? '')
    setError(null)
  }, [open, repuesto, solicitudInicial])

  const c = Number(cantidad)
  const stock = Number(repuesto?.stock ?? 0)
  const costoActual = Number(repuesto?.costo_promedio ?? 0)
  const nuevoCosto = modo === 'entrada' && c > 0 && costo != null ? Math.round((stock * costoActual + c * costo) / (stock + c)) : null

  const enviar = async () => {
    if (!Number.isInteger(c) || c <= 0) return setError('La cantidad debe ser un entero mayor a 0.')
    if (modo === 'entrada' && (costo == null || costo < 0)) return setError('Ingresa el costo unitario de compra.')
    if (modo === 'ajuste' && !motivo.trim()) return setError('El motivo del ajuste es obligatorio.')
    if (modo === 'ajuste' && tipoAjuste === 'ajuste_negativo' && c > stock) return setError(`No puedes descontar más de ${stock} u.`)
    const r = await onSubmit(
      modo === 'entrada'
        ? { tipo: 'entrada', cantidad: c, costo_unitario: costo, solicitud_id: solicitudId || null, motivo: motivo || 'Ingreso de mercadería' }
        : { tipo: tipoAjuste, cantidad: c, motivo },
    )
    if (r?.ok) onClose()
    else if (r?.error) setError(r.error)
  }

  return (
    <Modal
      open={open}
      titulo={`${modo === 'entrada' ? 'Ingreso de mercadería' : 'Ajuste de stock'} · ${repuesto?.nombre ?? ''}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={pending} onClick={enviar}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="muted small">
          Stock actual: <strong>{stock} u.</strong> · Costo promedio: <strong>{formatCLP(costoActual)}</strong>
        </p>
        {modo === 'ajuste' && (
          <FormField label="Tipo de ajuste" htmlFor="tipo-ajuste">
            <Select
              id="tipo-ajuste"
              value={tipoAjuste}
              onChange={(e) => setTipoAjuste(e.target.value)}
              options={[
                { value: 'ajuste_positivo', label: 'Sumar unidades (+)' },
                { value: 'ajuste_negativo', label: 'Descontar unidades (−)' },
              ]}
            />
          </FormField>
        )}
        <FormField label="Cantidad" htmlFor="mov-cantidad" required>
          <Input id="mov-cantidad" inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </FormField>
        {modo === 'entrada' && (
          <>
            <FormField
              label="Costo unitario de compra"
              htmlFor="mov-costo"
              required
              hint={nuevoCosto != null ? `Nuevo costo promedio: ${formatCLP(nuevoCosto)}` : undefined}
            >
              <MoneyInput id="mov-costo" value={costo} onChange={setCosto} />
            </FormField>
            {solicitudes.length > 0 && (
              <FormField label="Atiende la solicitud de compra" htmlFor="mov-sol" hint="La solicitud quedará marcada como recibida.">
                <Select
                  id="mov-sol"
                  value={solicitudId}
                  onChange={(e) => setSolicitudId(e.target.value)}
                  placeholder="Ninguna"
                  options={solicitudes.map((s) => ({
                    value: s.id,
                    label: `${s.cantidad} u. · ${s.ordenes_trabajo?.codigo ?? 'sin orden'} · ${s.estado}`,
                  }))}
                />
              </FormField>
            )}
          </>
        )}
        <FormField label={modo === 'ajuste' ? 'Motivo' : 'Nota (opcional)'} htmlFor="mov-motivo" required={modo === 'ajuste'}>
          <TextArea id="mov-motivo" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FormField>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
