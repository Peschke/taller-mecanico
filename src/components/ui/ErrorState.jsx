import Button from './Button'

export default function ErrorState({ mensaje = 'No se pudieron cargar los datos', onRetry }) {
  return (
    <div className="error-state" role="alert">
      <p className="error-state__msg">{mensaje}</p>
      {onRetry && (
        <Button size="sm" onClick={() => onRetry()}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
