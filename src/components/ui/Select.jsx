import { forwardRef } from 'react'

const Select = forwardRef(function Select({ options = [], placeholder, invalid, className, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={['input', 'input--select', invalid && 'input--invalid', className].filter(Boolean).join(' ')}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {placeholder != null && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  )
})

export default Select
