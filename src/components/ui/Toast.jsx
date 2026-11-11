export default function Toast({ tipo = 'info', mensaje, onClose }) {
  return (
    <div className={`toast toast--${tipo}`} role={tipo === 'error' ? 'alert' : undefined}>
      <span className="toast__msg">{mensaje}</span>
      <button type="button" className="icon-btn" aria-label="Cerrar aviso" onClick={onClose}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
