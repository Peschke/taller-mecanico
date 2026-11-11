import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { labelDe, TIPOS_FOTO } from '@/lib/constants/enums'

export default function FotoGallery({ fotos, loading }) {
  const [abierta, setAbierta] = useState(null)
  if (loading && !fotos?.length) {
    return (
      <div className="gallery">
        <Skeleton height={90} />
        <Skeleton height={90} />
        <Skeleton height={90} />
      </div>
    )
  }
  if (!fotos?.length) return <EmptyState mensaje="Sin fotos" compacto />
  return (
    <>
      <div className="gallery">
        {fotos.map((f) => (
          <button key={f.id} type="button" className="gallery__item" onClick={() => setAbierta(f)} aria-label={`Ver foto de ${labelDe(TIPOS_FOTO, f.tipo)}`}>
            {f.url ? <img src={f.url} alt="" loading="lazy" /> : <span className="muted small">No disponible</span>}
            <span className="gallery__tag">{labelDe(TIPOS_FOTO, f.tipo)}</span>
          </button>
        ))}
      </div>
      <Modal open={Boolean(abierta)} titulo={`Foto · ${labelDe(TIPOS_FOTO, abierta?.tipo)}`} onClose={() => setAbierta(null)} size="lg">
        {abierta?.url && <img src={abierta.url} alt={`Foto de ${labelDe(TIPOS_FOTO, abierta.tipo)}`} className="gallery__full" />}
      </Modal>
    </>
  )
}
