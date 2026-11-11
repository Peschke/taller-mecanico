import MecanicoLayout from '@/layouts/MecanicoLayout'
import RequireRole from './guards/RequireRole'
import { ROLES } from '@/lib/constants/roles'
import { lazyPage } from './lazyPage'

export const mecanicoRoutes = {
  element: <RequireRole roles={[ROLES.MECANICO]} />,
  children: [
    {
      path: '/taller',
      element: <MecanicoLayout />,
      children: [
        { index: true, element: lazyPage(() => import('@/pages/mecanico/MisTrabajosPage')) },
        { path: 'disponibles', element: lazyPage(() => import('@/pages/mecanico/OrdenesDisponiblesPage')) },
        { path: 'ordenes/:ordenId', element: lazyPage(() => import('@/pages/mecanico/OrdenTallerDetallePage')) },
        { path: 'ordenes/:ordenId/diagnostico', element: lazyPage(() => import('@/pages/mecanico/DiagnosticoPage')) },
        { path: 'ordenes/:ordenId/repuestos', element: lazyPage(() => import('@/pages/mecanico/RepuestosOrdenPage')) },
        { path: 'ordenes/:ordenId/avance', element: lazyPage(() => import('@/pages/mecanico/AvancePage')) },
        { path: 'solicitudes', element: lazyPage(() => import('@/pages/mecanico/MisSolicitudesPage')) },
        { path: 'notificaciones', element: lazyPage(() => import('@/pages/comun/NotificacionesPage')) },
        { path: 'mi-cuenta', element: lazyPage(() => import('@/pages/comun/MiCuentaPage')) },
      ],
    },
  ],
}
