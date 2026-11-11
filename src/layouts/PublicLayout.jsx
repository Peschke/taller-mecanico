import { NavLink, Outlet } from 'react-router-dom'
import Topbar from '@/components/layout/Topbar'

export default function PublicLayout() {
  return (
    <div className="shell shell--public">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <Topbar
        homeTo="/"
        right={
          <nav className="public-nav" aria-label="Accesos">
            <NavLink to="/seguimiento">Seguimiento</NavLink>
            <NavLink to="/acceso-cliente">Clientes</NavLink>
            <NavLink to="/login">Personal</NavLink>
          </nav>
        }
      />
      <main id="contenido" className="public-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
