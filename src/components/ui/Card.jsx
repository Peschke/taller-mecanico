export default function Card({ titulo, acciones, children, className, padding = true, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={['card', !padding && 'card--flush', className].filter(Boolean).join(' ')} {...rest}>
      {(titulo || acciones) && (
        <header className="card__header">
          {titulo && <h3 className="card__title">{titulo}</h3>}
          {acciones && <div className="card__actions">{acciones}</div>}
        </header>
      )}
      {children}
    </Tag>
  )
}
