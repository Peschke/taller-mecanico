import PublicLayout from '@/layouts/PublicLayout'
import { lazyPage } from './lazyPage'

export const publicRoutes = {
  element: <PublicLayout />,
  children: [
    { path: '/', element: lazyPage(() => import('@/pages/publico/LandingPage')) },
    { path: '/seguimiento', element: lazyPage(() => import('@/pages/publico/SeguimientoPage')) },
    { path: '/seguimiento/estado', element: lazyPage(() => import('@/pages/publico/SeguimientoEstadoPage')) },
    { path: '/seguimiento/historial', element: lazyPage(() => import('@/pages/publico/SeguimientoHistorialPage')) },
    { path: '/sin-acceso', element: lazyPage(() => import('@/pages/publico/SinAccesoPage')) },
    { path: '*', element: lazyPage(() => import('@/pages/publico/NotFoundPage')) },
  ],
}
