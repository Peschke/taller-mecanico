import { forwardRef } from 'react'
import Input from '@/components/ui/Input'
import { formatearRut, rutValido } from '@/lib/rut'

// Acepta 12.345.678-9, 12345678-9 o 123456789; al salir del campo lo formatea con puntos
const RutInput = forwardRef(function RutInput({ value, onChange, invalid, ...rest }, ref) {
  const limpio = String(value ?? '').replace(/[^0-9kK.-]/g, '')
  const ok = limpio.length >= 8 && rutValido(limpio)
  return (
    <div className="input-adorned">
      <Input
        ref={ref}
        inputMode="text"
        autoComplete="off"
        placeholder="12.345.678-9"
        maxLength={12}
        value={limpio}
        invalid={invalid}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9kK.-]/g, '').toUpperCase())}
        onBlur={() => ok && onChange(formatearRut(limpio))}
        {...rest}
      />
      {ok && (
        <span className="input-adorned__ok" aria-label="RUT válido">
          ✓
        </span>
      )}
    </div>
  )
})

export default RutInput
