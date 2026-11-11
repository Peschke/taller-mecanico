import AppShell from './AppShell'
import { mecanicoNav } from './nav/mecanicoNav'

// Celular primero (RNF01): barra inferior, sin sidebar
export default function MecanicoLayout() {
  return <AppShell variant="bottom" nav={mecanicoNav} homeTo="/taller" theme="mecanico" />
}
