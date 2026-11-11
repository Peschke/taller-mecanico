import { Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import SplashScreen from '@/components/layout/SplashScreen'
import RedirectByRole from './RedirectByRole'

// Login y accesos: si ya hay sesión válida, a la home del rol (o a la ruta que pedía antes)
export default function PublicOnly() {
  const { status, session, tipoCuenta } = useAuth()
  if (status === 'loading') return <SplashScreen />
  if (session && tipoCuenta && tipoCuenta !== 'sin_acceso') return <RedirectByRole />
  return <Outlet />
}
