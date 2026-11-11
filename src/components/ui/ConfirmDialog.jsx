import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({ open, titulo = '¿Confirmar?', mensaje, confirmarTexto = 'Confirmar', peligro = false, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      titulo={titulo}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button variant={peligro ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmarTexto}
          </Button>
        </>
      }
    >
      {mensaje && <p>{mensaje}</p>}
    </Modal>
  )
}
