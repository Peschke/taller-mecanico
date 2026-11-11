import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ open, titulo, onClose, children, footer, size = 'md', sheet = false }) {
  const tituloId = useId()
  const panel = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const prevFocus = document.activeElement
    panel.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    panel.current?.addEventListener('keydown', onKey)
    const el = panel.current
    document.body.style.overflow = 'hidden'
    return () => {
      el?.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prevFocus?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={['modal', sheet && 'modal--sheet'].filter(Boolean).join(' ')} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={panel}
        className={`modal__panel modal__panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
      >
        <header className="modal__header">
          <h2 id={tituloId} className="modal__title">
            {titulo}
          </h2>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
