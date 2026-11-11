import AdminLayout from '@/layouts/AdminLayout'
import RequireRole from './guards/RequireRole'
import { ROLES } from '@/lib/constants/roles'
import { lazyPage } from './lazyPage'
import { paginasRecepcion } from './recepcionRoutes'

export const adminRoutes = {
  element: <RequireRole roles={[ROLES.ADMIN]} />,
  children: [
    {
      path: '/admin',
      element: <AdminLayout />,
      children: [
        { index: true, element: lazyPage(() => import('@/pages/admin/AdminDashboardPage')) },
        { path: 'ordenes', element: lazyPage(() => import('@/pages/admin/OrdenesAdminPage')) },
        { path: 'ordenes/nueva/:vehiculoId', element: paginasRecepcion.nuevaOrden() },
        { path: 'ordenes/:ordenId', element: lazyPage(() => import('@/pages/admin/OrdenAdminDetallePage')) },
        { path: 'ordenes/:ordenId/presupuesto', element: lazyPage(() => import('@/pages/admin/PresupuestoEditorPage')) },
        { path: 'ordenes/:ordenId/cobro', element: lazyPage(() => import('@/pages/admin/CobroOrdenPage')) },
        { path: 'ordenes/:ordenId/notificar', element: paginasRecepcion.notificar() },
        { path: 'presupuestos', element: lazyPage(() => import('@/pages/admin/ColaPresupuestosPage')) },
        { path: 'caja', element: lazyPage(() => import('@/pages/admin/CajaPage')) },
        { path: 'inventario', element: lazyPage(() => import('@/pages/admin/InventarioPage')) },
        { path: 'inventario/nuevo', element: lazyPage(() => import('@/pages/admin/RepuestoFormPage')) },
        { path: 'inventario/:repuestoId', element: lazyPage(() => import('@/pages/admin/RepuestoKardexPage')) },
        { path: 'inventario/:repuestoId/editar', element: lazyPage(() => import('@/pages/admin/RepuestoFormPage')) },
        { path: 'compras', element: lazyPage(() => import('@/pages/admin/SolicitudesCompraPage')) },
        { path: 'reportes', element: lazyPage(() => import('@/pages/admin/ReportesPage')) },
        { path: 'usuarios', element: lazyPage(() => import('@/pages/admin/UsuariosPage')) },
        { path: 'usuarios/nuevo', element: lazyPage(() => import('@/pages/admin/UsuarioFormPage')) },
        { path: 'usuarios/:usuarioId', element: lazyPage(() => import('@/pages/admin/UsuarioFormPage')) },
        { path: 'catalogos', element: lazyPage(() => import('@/pages/admin/CatalogosPage')) },
        { path: 'auditoria', element: lazyPage(() => import('@/pages/admin/AuditoriaPage')) },
        { path: 'registro', element: paginasRecepcion.registro() },
        { path: 'clientes', element: paginasRecepcion.clientes() },
        { path: 'clientes/:clienteId', element: paginasRecepcion.cliente() },
        { path: 'vehiculos', element: paginasRecepcion.vehiculos() },
        { path: 'vehiculos/:vehiculoId', element: paginasRecepcion.vehiculo() },
        { path: 'por-notificar', element: paginasRecepcion.porNotificar() },
        { path: 'notificaciones', element: paginasRecepcion.notificaciones() },
        { path: 'mi-cuenta', element: paginasRecepcion.miCuenta() },
      ],
    },
  ],
}
