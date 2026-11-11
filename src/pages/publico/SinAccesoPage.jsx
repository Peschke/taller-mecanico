import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import Button from '@/components/ui/Button'
import { MENSAJES } from '@/lib/constants/mensajes'
import { PATHS } from '@/routes/paths'

const TEXTOS = {
  desactivada: MENSAJES.CUENTA_DESACTIVADA,
  'sin-vinculo': MENSAJES.CUENTA_SIN_VINCULO,
  error: 'No pudimos verificar tu cuenta. Intenta nuevamente en unos minutos.',
}

export default function SinAccesoPage() {
  const { session, motivoSinAcceso, signOut, refreshCuenta } = useAuth()
  const navigate = useNavigate()

  const salir = async () => {
    await signOut()
    navigate(PATHS.landing, { replace: true })
  }

  return (
    <div className="narrow stack">
      <h1>Sin acceso</h1>
      <p>{TEXTOS[motivoSinAcceso] ?? 'No tienes acceso a esta sección.'}</p>
      <div className="row-wrap">
        <Button variant="primary" to={PATHS.seguimiento}>
          Seguir con código
        </Button>
        {motivoSinAcceso === 'error' && <Button onClick={refreshCuenta}>Reintentar</Button>}
        {session && <Button onClick={salir}>Cerrar sesión</Button>}
      </div>
    </div>
  )
}
