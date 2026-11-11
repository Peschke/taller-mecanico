import Button from './Button'

// Paginación por rango: from = page * pageSize, to = from + pageSize - 1 (supabase .range())
export default function Pagination({ page, pageSize, total, onChange }) {
  if (total == null || total <= pageSize) return null
  const paginas = Math.ceil(total / pageSize)
  return (
    <nav className="pagination" aria-label="Paginación">
      <Button size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <span className="muted">
        Página {page + 1} de {paginas}
      </span>
      <Button size="sm" disabled={page >= paginas - 1} onClick={() => onChange(page + 1)}>
        Siguiente
      </Button>
    </nav>
  )
}
