import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import NotificationBell from '@/components/layout/NotificationBell'
import UserMenu from '@/components/layout/UserMenu'
import GlobalSearch from '@/components/layout/GlobalSearch'

/**
 * Estructura común de las áreas privadas.
 * variant: 'sidebar' (admin, recepción) | 'bottom' (mecánico) | 'simple' (cliente)
 */
export default function AppShell({ variant = 'sidebar', nav = [], badges, homeTo, search = false, bell = true, theme }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <div className={['shell', `shell--${variant}`, theme && `theme-${theme}`].filter(Boolean).join(' ')}>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <Topbar
        homeTo={homeTo}
        onToggleMenu={variant === 'sidebar' ? () => setMenuOpen((o) => !o) : undefined}
        center={search ? <GlobalSearch /> : null}
        right={
          <>
            {bell && <NotificationBell />}
            <UserMenu />
          </>
        }
      />
      <div className="shell__body">
        {variant === 'sidebar' && (
          <>
            <Sidebar items={nav} badges={badges} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
            {menuOpen && <div className="shell__overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
          </>
        )}
        <main id="contenido" className="shell__main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      {variant === 'bottom' && <BottomNav items={nav} badges={badges} />}
    </div>
  )
}
