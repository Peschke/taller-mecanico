import FormField from '@/components/ui/FormField'
import TextArea from '@/components/ui/TextArea'

export function mensajeVehiculoListo(orden) {
  const v = orden?.vehiculos
  const nombre = orden?.clientes?.nombre?.split(' ')[0] ?? ''
  return `Hola ${nombre}, tu ${v?.marca ?? ''} ${v?.modelo ?? ''} patente ${v?.patente ?? ''} ya está listo para retiro en el taller (orden ${orden?.codigo ?? ''}). Puedes revisar el detalle con tu código de seguimiento ${orden?.codigo_seguimiento ?? ''}.`
    .replace(/\s+/g, ' ')
    .trim()
}

// Vista previa editable del aviso (CU-03 paso 3)
export default function MensajePreview({ value, onChange, disabled }) {
  return (
    <FormField label="Mensaje" htmlFor="mensaje-aviso" hint={`${value.length} caracteres`}>
      <TextArea id="mensaje-aviso" rows={5} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </FormField>
  )
}
