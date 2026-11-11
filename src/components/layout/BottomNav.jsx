import { NavLink } from 'react-router-dom'
import Icon from './Icon'

export default function BottomNav({ items, badges = {} }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) => ['bottom-nav__link', isActive && 'bottom-nav__link--active'].filter(Boolean).join(' ')}
        >
          <Icon name={it.icon} size={22} />
          <span>{it.label}</span>
          {it.badgeKey && badges[it.badgeKey] > 0 && <span className="bottom-nav__badge">{badges[it.badgeKey]}</span>}
        </NavLink>
      ))}
    </nav>
  )
}
