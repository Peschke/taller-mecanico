export default function ProgressBar({ value = 0, label = 'Avance', showValue = true }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="progress">
      <div className="progress__track" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress__bar" style={{ width: `${v}%` }} />
      </div>
      {showValue && <span className="progress__value">{v}%</span>}
    </div>
  )
}
