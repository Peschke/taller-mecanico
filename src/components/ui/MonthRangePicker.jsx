// Valores en formato 'YYYY-MM' (input type="month"); compárense contra la columna mes ('YYYY-MM-01') de las vistas
export default function MonthRangePicker({ desde, hasta, onChange }) {
  return (
    <div className="month-range">
      <label className="field__label">
        Desde
        <input type="month" className="input" value={desde} max={hasta} onChange={(e) => onChange({ desde: e.target.value, hasta })} />
      </label>
      <label className="field__label">
        Hasta
        <input type="month" className="input" value={hasta} min={desde} onChange={(e) => onChange({ desde, hasta: e.target.value })} />
      </label>
    </div>
  )
}
