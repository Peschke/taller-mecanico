import ClienteLayout from '@/layouts/ClienteLayout'
import RequireRole from './guards/RequireRole'
import { ROLES } from '@/lib/constants/roles'
import { lazyPage } from './lazyPage'

export const clienteRoutes = {
  element: <RequireRole roles={[ROLES.CLIENTE]} />,
  children: [
    {
      path: '/cliente',
      element: <ClienteLayout />,
      children: [
        { index: true, element: lazyPage(() => import('@/pages/cliente/ClienteInicioPage')) },
        { path: 'ordenes/:ordenId', element: lazyPage(() => import('@/pages/cliente/ClienteOrdenPage')) },
        { path: 'ordenes/:ordenId/presupuesto', element: lazyPage(() => import('@/pages/cliente/ClientePresupuestoPage')) },
        { path: 'vehiculos/:vehiculoId/historial', element: lazyPage(() => import('@/pages/cliente/ClienteHistorialPage')) },
      ],
    },
  ],
}
