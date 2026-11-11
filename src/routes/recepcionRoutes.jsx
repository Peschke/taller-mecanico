import RecepcionLayout from '@/layouts/RecepcionLayout'
import RequireRole from './guards/RequireRole'
import { ROLES } from '@/lib/constants/roles'
import { lazyPage } from './lazyPage'

// Páginas de recepción reutilizadas también por el área de administración
export const paginasRecepcion = {
  registro: () => lazyPage(() => import('@/pages/recepcion/RegistrarClienteVehiculoPage')),
  clientes: () => lazyPage(() => import('@/pages/recepcion/BuscarClientePage')),
  cliente: () => lazyPage(() => import('@/pages/recepcion/ClienteDetallePage')),
  vehiculo: () => lazyPage(() => import('@/pages/recepcion/VehiculoDetallePage')),
  nuevaOrden: () => lazyPage(() => import('@/pages/recepcion/NuevaOrdenPage')),
  vehiculos: () => lazyPage(() => import('@/pages/recepcion/VehiculosPage')),
  porNotificar: () => lazyPage(() => import('@/pages/recepcion/PorNotificarPage')),
  notificar: () => lazyPage(() => import('@/pages/recepcion/NotificarClientePage')),
  notificaciones: () => lazyPage(() => import('@/pages/comun/NotificacionesPage')),
  miCuenta: () => lazyPage(() => import('@/pages/comun/MiCuentaPage')),
}

export const recepcionRoutes = {
  element: <RequireRole roles={[ROLES.RECEPCIONISTA]} />,
  children: [
    {
      path: '/recepcion',
      element: <RecepcionLayout />,
      children: [
        { index: true, element: lazyPage(() => import('@/pages/recepcion/RecepcionPanelPage')) },
        { path: 'registro', element: paginasRecepcion.registro() },
        { path: 'clientes', element: paginasRecepcion.clientes() },
        { path: 'clientes/:clienteId', element: paginasRecepcion.cliente() },
        { path: 'vehiculos', element: paginasRecepcion.vehiculos() },
        { path: 'vehiculos/:vehiculoId', element: paginasRecepcion.vehiculo() },
        { path: 'ordenes/nueva/:vehiculoId', element: paginasRecepcion.nuevaOrden() },
        { path: 'ordenes/:ordenId', element: lazyPage(() => import('@/pages/recepcion/OrdenRecepcionDetallePage')) },
        { path: 'por-notificar', element: paginasRecepcion.porNotificar() },
        { path: 'ordenes/:ordenId/notificar', element: paginasRecepcion.notificar() },
        { path: 'notificaciones', element: paginasRecepcion.notificaciones() },
        { path: 'mi-cuenta', element: paginasRecepcion.miCuenta() },
      ],
    },
  ],
}
