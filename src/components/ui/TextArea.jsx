import { forwardRef } from 'react'

const TextArea = forwardRef(function TextArea({ invalid, rows = 4, className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={['input', 'input--textarea', invalid && 'input--invalid', className].filter(Boolean).join(' ')}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
})

export default TextArea
