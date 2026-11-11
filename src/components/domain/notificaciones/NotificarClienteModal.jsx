import Modal from '@/components/ui/Modal'
import NotificarClientePanel from './NotificarClientePanel'

export default function NotificarClienteModal({ orden, canalInicial, onClose, onNotificado, base }) {
  return (
    <Modal open={Boolean(orden)} titulo={`Notificar al cliente · ${orden?.vehiculos?.patente ?? ''}`} onClose={onClose}>
      {orden && (
        <NotificarClientePanel
          key={`${orden.id}-${canalInicial}`}
          orden={orden}
          canalInicial={canalInicial}
          base={base}
          onNotificado={() => {
            onNotificado?.()
            onClose()
          }}
        />
      )}
    </Modal>
  )
}
