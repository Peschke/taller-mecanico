import { Link } from 'react-router-dom'
import Spinner from './Spinner'

const cx = (...c) => c.filter(Boolean).join(' ')

export default function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  loading = false,
  to,
  type = 'button',
  className,
  children,
  disabled,
  ...rest
}) {
  const clases = cx('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className)
  if (to) {
    return (
      <Link to={to} className={clases} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={clases} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Spinner size="sm" inline />}
      {children}
    </button>
  )
}
