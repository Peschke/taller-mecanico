import { ToastProvider } from '@/context/ToastContext'
import { AuthProvider } from '@/context/AuthContext'
import { CatalogProvider } from '@/context/CatalogContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { PortalProvider } from '@/context/PortalContext'

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CatalogProvider>
          <NotificationsProvider>
            <PortalProvider>{children}</PortalProvider>
          </NotificationsProvider>
        </CatalogProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
