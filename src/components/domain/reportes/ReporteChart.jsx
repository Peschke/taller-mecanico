// Gráfico de barras agrupadas en SVG, sin dependencias.
// data: [{ label, ...valores }]; series: [{ key, label, color }]; format: (n) => string
const COLORES = ['#1F4FBF', '#9DB4EA', '#B4430B', '#57606A']

export default function ReporteChart({ data, series, format = (n) => n, height = 260, titulo }) {
  if (!data?.length) return null
  const W = 720
  const H = height
  const pad = { top: 16, right: 16, bottom: 44, left: 72 }
  const iw = W - pad.left - pad.right
  const ih = H - pad.top - pad.bottom
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)))
  const paso = Math.pow(10, Math.floor(Math.log10(max)))
  const tope = Math.ceil(max / paso) * paso
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * tope)
  const grupo = iw / data.length
  const barW = Math.max(4, Math.min(28, (grupo * 0.7) / series.length))
  const y = (v) => pad.top + ih - (Math.max(0, v) / tope) * ih

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo ?? 'Gráfico'}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#E3E7EC" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#57606A">
              {format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x0 = pad.left + i * grupo + (grupo - barW * series.length) / 2
          return (
            <g key={d.label}>
              {series.map((s, j) => {
                const v = Number(d[s.key]) || 0
                return (
                  <rect key={s.key} x={x0 + j * barW} y={y(v)} width={barW - 2} height={pad.top + ih - y(v)} rx="2" fill={s.color ?? COLORES[j % COLORES.length]}>
                    <title>{`${d.label} · ${s.label}: ${format(v)}`}</title>
                  </rect>
                )
              })}
              <text x={pad.left + i * grupo + grupo / 2} y={H - pad.bottom + 18} textAnchor="middle" fontSize="11" fill="#57606A">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="chart__legend">
        {series.map((s, j) => (
          <span key={s.key} className="chart__key">
            <span className="chart__swatch" style={{ background: s.color ?? COLORES[j % COLORES.length] }} />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
