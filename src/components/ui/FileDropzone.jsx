import { useId, useRef, useState } from 'react'
import { TIPOS_IMAGEN } from '@/lib/storagePaths'

export default function FileDropzone({ onFiles, multiple = true, accept = TIPOS_IMAGEN.join(','), label = 'Agregar fotos', disabled }) {
  const id = useId()
  const input = useRef(null)
  const [arrastrando, setArrastrando] = useState(false)

  const entregar = (lista) => {
    const files = Array.from(lista ?? [])
    if (files.length) onFiles?.(files)
  }

  return (
    <div
      className={['dropzone', arrastrando && 'dropzone--over', disabled && 'dropzone--disabled'].filter(Boolean).join(' ')}
      onDragOver={(e) => {
        e.preventDefault()
        setArrastrando(true)
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault()
        setArrastrando(false)
        if (!disabled) entregar(e.dataTransfer.files)
      }}
    >
      <label htmlFor={id} className="btn btn--secondary btn--md">
        {label}
      </label>
      <input
        ref={input}
        id={id}
        type="file"
        className="sr-only"
        accept={accept}
        capture="environment"
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          entregar(e.target.files)
          e.target.value = ''
        }}
      />
      <span className="muted">o arrastra las imágenes aquí (JPG, PNG, WebP, HEIC · máx. 10 MB)</span>
    </div>
  )
}
