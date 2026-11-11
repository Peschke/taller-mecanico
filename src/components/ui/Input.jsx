import { forwardRef } from 'react'

const Input = forwardRef(function Input({ invalid, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={['input', invalid && 'input--invalid', className].filter(Boolean).join(' ')}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
})

export default Input
