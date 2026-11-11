import { Link } from 'react-router-dom'

// items: [{ label, to? }]
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Ruta de navegación" className="breadcrumbs">
      <ol>
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`}>
            {it.to && i < items.length - 1 ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
