import DataTable from '@/components/ui/DataTable'

// columns: [{ key, header, render?, align?, total?: (rows) => node }]
export default function ReporteTable({ columns, rows, rowKey, loading, error, onRetry, emptyMessage }) {
  const conTotales = columns.some((c) => c.total)
  return (
    <div className="stack">
      <DataTable columns={columns} rows={rows} rowKey={rowKey} loading={loading} error={error} onRetry={onRetry} emptyMessage={emptyMessage} />
      {conTotales && rows?.length > 0 && (
        <div className="table-wrap">
          <table className="table table--totales">
            <tbody>
              <tr>
                {columns.map((c, i) => (
                  <td key={c.key} style={{ textAlign: c.align }}>
                    {c.total ? c.total(rows) : i === 0 ? <strong>Total</strong> : ''}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
