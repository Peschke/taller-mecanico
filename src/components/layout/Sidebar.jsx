import { NavLink } from 'react-router-dom'
import Icon from './Icon'

// items: [{ section?, label, to, icon, end?, badgeKey? }]
export default function Sidebar({ items, badges = {}, open, onNavigate, footer }) {
  return (
    <aside className={['sidebar', open && 'sidebar--open'].filter(Boolean).join(' ')} aria-label="Menú principal">
      <nav className="sidebar__nav">
        {items.map((it) =>
          it.section ? (
            <div key={`s-${it.section}`} className="sidebar__section">
              {it.section}
            </div>
          ) : (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              onClick={onNavigate}
              className={({ isActive }) => ['sidebar__link', isActive && 'sidebar__link--active'].filter(Boolean).join(' ')}
            >
              <Icon name={it.icon} size={18} />
              <span className="sidebar__label">{it.label}</span>
              {it.badgeKey && badges[it.badgeKey] > 0 && <span className="sidebar__badge">{badges[it.badgeKey]}</span>}
            </NavLink>
          ),
        )}
      </nav>
      {footer && <div className="sidebar__footer">{footer}</div>}
    </aside>
  )
}
