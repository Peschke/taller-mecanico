import { Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import RedirectByRole from './RedirectByRole'

// Va siempre dentro de <RequireAuth>. Si el rol no corresponde, envía a la home del propio rol.
export default function RequireRole({ roles }) {
  const { rol } = useAuth()
  if (!roles.includes(rol)) return <RedirectByRole />
  return <Outlet />
}
