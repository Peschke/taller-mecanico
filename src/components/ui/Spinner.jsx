export default function Spinner({ size = 'md', inline = false, label = 'Cargando' }) {
  return (
    <span className={['spinner', `spinner--${size}`, inline && 'spinner--inline'].filter(Boolean).join(' ')} role="status">
      <span className="sr-only">{label}</span>
    </span>
  )
}
