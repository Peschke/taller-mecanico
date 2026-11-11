import AuthLayout from '@/layouts/AuthLayout'
import PublicOnly from './guards/PublicOnly'
import { lazyPage } from './lazyPage'

export const authRoutes = {
  element: <AuthLayout />,
  children: [
    {
      element: <PublicOnly />,
      children: [
        { path: '/login', element: lazyPage(() => import('@/pages/auth/LoginPersonalPage')) },
        { path: '/acceso-cliente', element: lazyPage(() => import('@/pages/auth/AccesoClientePage')) },
        { path: '/recuperar-clave', element: lazyPage(() => import('@/pages/auth/RecuperarClavePage')) },
      ],
    },
    { path: '/auth/callback', element: lazyPage(() => import('@/pages/auth/AuthCallbackPage')) },
    { path: '/actualizar-clave', element: lazyPage(() => import('@/pages/auth/ActualizarClavePage')) },
  ],
}
