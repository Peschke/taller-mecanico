import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import SplashScreen from '@/components/layout/SplashScreen'
import { PATHS } from '@/routes/paths'

export default function RequireAuth() {
  const { status, session, tipoCuenta } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <SplashScreen mensaje="Verificando tu sesión…" />

  if (!session) {
    const destino = location.pathname.startsWith('/cliente') ? PATHS.accesoCliente : PATHS.login
    return <Navigate to={destino} replace state={{ from: location }} />
  }

  if (tipoCuenta === 'sin_acceso') return <Navigate to={PATHS.sinAcceso} replace />

  return <Outlet />
}
