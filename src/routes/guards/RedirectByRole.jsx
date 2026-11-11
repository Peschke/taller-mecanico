import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import SplashScreen from '@/components/layout/SplashScreen'
import { HOME_POR_ROL } from '@/lib/constants/roles'
import { PATHS } from '@/routes/paths'

export default function RedirectByRole() {
  const { status, session, rol, tipoCuenta } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <SplashScreen />
  if (!session) return <Navigate to={PATHS.landing} replace />
  if (tipoCuenta === 'sin_acceso' || !rol) return <Navigate to={PATHS.sinAcceso} replace />

  const home = HOME_POR_ROL[rol]
  const desde = location.state?.from?.pathname
  // Vuelve a la ruta pedida solo si pertenece al área de su rol
  const destino = desde && desde.startsWith(home) ? desde + (location.state.from.search ?? '') : home
  return <Navigate to={destino} replace />
}
