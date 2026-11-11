import PageHeader from '@/components/layout/PageHeader'
import EmptyState from './EmptyState'

// Marcador para las pantallas que se implementan en los siguientes módulos
export default function EnConstruccion({ titulo, modulo, cu }) {
  return (
    <>
      <PageHeader titulo={titulo} subtitulo={cu} />
      <div className="card">
        <EmptyState mensaje="Pantalla en construcción" detalle={modulo} />
      </div>
    </>
  )
}
