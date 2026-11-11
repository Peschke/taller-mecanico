import FileDropzone from '@/components/ui/FileDropzone'
import ProgressBar from '@/components/ui/ProgressBar'

/**
 * Selección de fotos con arrastrar y soltar, vista previa, quitar antes de guardar
 * y progreso por archivo. Se usa con el hook useSubirFotos.
 */
export default function FotoUploader({ items, rechazos = [], onAgregar, onQuitar, bloqueado = false, maximo = 12 }) {
  return (
    <div className="stack">
      <FileDropzone onFiles={onAgregar} disabled={bloqueado || items.length >= maximo} label="Agregar fotos" />
      {rechazos.length > 0 && (
        <ul className="form-error small" role="alert">
          {rechazos.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {items.length > 0 && (
        <ul className="uploader">
          {items.map((it) => (
            <li key={it.id} className={`uploader__item uploader__item--${it.estado}`}>
              <img src={it.preview} alt={`Vista previa de ${it.file.name}`} />
              <div className="uploader__meta">
                <span className="uploader__name" title={it.file.name}>
                  {it.file.name}
                </span>
                {it.estado === 'pendiente' && <span className="muted small">{(it.file.size / 1024 / 1024).toFixed(1)} MB</span>}
                {it.estado === 'subiendo' && <ProgressBar value={it.progreso} label={`Subiendo ${it.file.name}`} />}
                {it.estado === 'ok' && <span className="text-success small">Subida</span>}
                {it.estado === 'error' && <span className="text-danger small">{it.error}</span>}
              </div>
              {(it.estado === 'pendiente' || it.estado === 'error') && !bloqueado && (
                <button type="button" className="icon-btn uploader__remove" aria-label={`Quitar ${it.file.name}`} onClick={() => onQuitar(it.id)}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">
        {items.length} de {maximo} fotos. Se suben al generar la orden.
      </p>
    </div>
  )
}
