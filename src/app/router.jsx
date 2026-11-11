import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from '@/routes/guards/RequireAuth'
import { publicRoutes } from '@/routes/publicRoutes'
import { authRoutes } from '@/routes/authRoutes'
import { recepcionRoutes } from '@/routes/recepcionRoutes'
import { mecanicoRoutes } from '@/routes/mecanicoRoutes'
import { adminRoutes } from '@/routes/adminRoutes'
import { clienteRoutes } from '@/routes/clienteRoutes'

export const router = createBrowserRouter([
  authRoutes,
  {
    element: <RequireAuth />,
    children: [adminRoutes, recepcionRoutes, mecanicoRoutes, clienteRoutes],
  },
  // Al final: contiene la ruta comodín '*'
  publicRoutes,
])
