import Skeleton from './Skeleton'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'

/**
 * columns: [{ key, header, render?: (row) => node, align?: 'right', width? }]
 */
export default function DataTable({
  columns,
  rows,
  rowKey = 'id',
  loading,
  error,
  onRetry,
  emptyMessage = 'Sin resultados',
  onRowClick,
  caption,
}) {
  if (error) return <ErrorState mensaje={error} onRetry={onRetry} />

  return (
    <div className="table-wrap">
      <table className="table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align }} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            !rows?.length &&
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`sk-${i}`}>
                {columns.map((c) => (
                  <td key={c.key}>
                    <Skeleton height={14} />
                  </td>
                ))}
              </tr>
            ))}
          {!loading && !rows?.length && (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState mensaje={emptyMessage} compacto />
              </td>
            </tr>
          )}
          {rows?.map((row) => (
            <tr
              key={row[rowKey]}
              className={onRowClick ? 'table__row--click' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
