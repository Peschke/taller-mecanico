import Spinner from '@/components/ui/Spinner'

export default function SplashScreen({ mensaje = 'Cargando…' }) {
  return (
    <div className="splash">
      <Spinner size="lg" label={mensaje} />
      <p className="muted">{mensaje}</p>
    </div>
  )
}
