import { useEffect, useState } from 'react'

const fmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

// Entrada de pesos chilenos sin decimales. value/onChange trabajan con número (o null).
export default function MoneyInput({ value, onChange, invalid, id, ...rest }) {
  const [texto, setTexto] = useState(value == null ? '' : fmt.format(value))

  useEffect(() => {
    setTexto(value == null || value === '' ? '' : fmt.format(value))
  }, [value])

  return (
    <div className={['money', invalid && 'input--invalid'].filter(Boolean).join(' ')}>
      <span className="money__prefix" aria-hidden="true">$</span>
      <input
        id={id}
        className="input money__input"
        inputMode="numeric"
        value={texto}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          const digitos = e.target.value.replace(/\D/g, '')
          setTexto(digitos ? fmt.format(Number(digitos)) : '')
          onChange?.(digitos ? Number(digitos) : null)
        }}
        {...rest}
      />
    </div>
  )
}
