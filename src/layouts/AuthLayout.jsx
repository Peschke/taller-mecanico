import { Link, Outlet } from 'react-router-dom'
import Icon from '@/components/layout/Icon'

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <main id="contenido" className="auth-card">
        <Link to="/" className="auth-card__brand">
          <span className="topbar__logo" aria-hidden="true">
            <Icon name="trabajos" size={18} />
          </span>
          Taller
        </Link>
        <Outlet />
      </main>
    </div>
  )
}
