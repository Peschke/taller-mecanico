import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import RedirectByRole from '@/routes/guards/RedirectByRole'
import SplashScreen from '@/components/layout/SplashScreen'
import Icon from '@/components/layout/Icon'
import { PATHS } from '@/routes/paths'

const ACCESOS = [
  {
    to: PATHS.seguimiento,
    icon: 'auto',
    titulo: 'Seguir mi vehículo',
    texto: 'Con la patente y el código de seguimiento de tu comprobante.',
    primario: true,
  },
  { to: PATHS.accesoCliente, icon: 'clientes', titulo: 'Cliente', texto: 'Entra con tu correo y ve todos tus vehículos.' },
  { to: PATHS.login, icon: 'trabajos', titulo: 'Personal del taller', texto: 'Administración, recepción y mecánicos.' },
]

export default function LandingPage() {
  const { status, session, tipoCuenta } = useAuth()
  if (status === 'loading') return <SplashScreen />
  if (session && tipoCuenta && tipoCuenta !== 'sin_acceso') return <RedirectByRole />

  return (
    <div className="landing">
      <h1 className="landing__title">¿Cómo va tu auto?</h1>
      <p className="landing__lead">Consulta el estado de la reparación, aprueba tu presupuesto y revisa tu historial sin llamar al taller.</p>
      <div className="landing__grid">
        {ACCESOS.map((a) => (
          <Link key={a.to} to={a.to} className={['landing__card', a.primario && 'landing__card--primary'].filter(Boolean).join(' ')}>
            <Icon name={a.icon} size={28} />
            <span className="landing__card-title">{a.titulo}</span>
            <span className="landing__card-text">{a.texto}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
