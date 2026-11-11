export default function EmptyState({ mensaje, detalle, accion, compacto = false }) {
  return (
    <div className={['empty', compacto && 'empty--compact'].filter(Boolean).join(' ')}>
      <p className="empty__msg">{mensaje}</p>
      {detalle && <p className="empty__detail">{detalle}</p>}
      {accion && <div className="empty__action">{accion}</div>}
    </div>
  )
}
