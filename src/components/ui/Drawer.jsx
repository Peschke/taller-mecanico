import Modal from './Modal'

// En celular se muestra como hoja inferior
export default function Drawer(props) {
  return <Modal {...props} sheet />
}
