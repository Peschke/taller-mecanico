// Muestra solo los campos que cambiaron entre datos_antes y datos_despues
const IGNORAR = ['updated_at', 'created_at']

const mostrar = (v) => {
  if (v == null) return <span className="muted">—</span>
  if (typeof v === 'object') return <code className="code">{JSON.stringify(v)}</code>
  return String(v)
}

export default function AuditoriaDiff({ antes, despues }) {
  const claves = Array.from(new Set([...Object.keys(antes ?? {}), ...Object.keys(despues ?? {})])).filter((k) => !IGNORAR.includes(k))
  const cambiadas = claves.filter((k) => JSON.stringify(antes?.[k]) !== JSON.stringify(despues?.[k]))
  const filas = antes && despues ? cambiadas : claves

  if (!filas.length) return <p className="muted small">Sin diferencias visibles.</p>

  return (
    <div className="table-wrap">
      <table className="table table--compact">
        <thead>
          <tr>
            <th>Campo</th>
            {antes && <th>Antes</th>}
            {despues && <th>Después</th>}
          </tr>
        </thead>
        <tbody>
          {filas.map((k) => (
            <tr key={k}>
              <td>
                <code className="code">{k}</code>
              </td>
              {antes && <td>{mostrar(antes[k])}</td>}
              {despues && <td>{mostrar(despues[k])}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
