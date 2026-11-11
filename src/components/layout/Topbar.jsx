import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function Topbar({ homeTo = '/', onToggleMenu, center, right, titulo }) {
  return (
    <header className="topbar">
      {onToggleMenu && (
        <button type="button" className="icon-btn topbar__menu" aria-label="Abrir menú" onClick={onToggleMenu}>
          <Icon name="menu" />
        </button>
      )}
      <Link to={homeTo} className="topbar__brand">
        <span className="topbar__logo" aria-hidden="true">
          <Icon name="trabajos" size={18} />
        </span>
        <span>{titulo ?? 'Taller'}</span>
      </Link>
      <div className="topbar__center">{center}</div>
      <div className="topbar__right">{right}</div>
    </header>
  )
}
