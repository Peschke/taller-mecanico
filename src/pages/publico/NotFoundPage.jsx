import Button from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="narrow stack">
      <h1>Página no encontrada</h1>
      <p className="muted">La dirección no existe o fue movida.</p>
      <div>
        <Button variant="primary" to="/">
          Ir al inicio
        </Button>
      </div>
    </div>
  )
}
