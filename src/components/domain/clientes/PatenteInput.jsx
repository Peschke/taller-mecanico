import { forwardRef } from 'react'
import Input from '@/components/ui/Input'
import { normalizarPatente } from '@/lib/patente'

// Normaliza mientras se escribe, igual que privado.normalizar_patente(): "ab-cd 12" → "ABCD12"
const PatenteInput = forwardRef(function PatenteInput({ value, onChange, className, ...rest }, ref) {
  return (
    <Input
      ref={ref}
      className={['input--patente', className].filter(Boolean).join(' ')}
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      maxLength={8}
      placeholder="ABCD12"
      value={value}
      onChange={(e) => onChange(normalizarPatente(e.target.value).slice(0, 8))}
      {...rest}
    />
  )
})

export default PatenteInput
