import Stepper from '@/components/ui/Stepper'
import { ETAPAS, etapaEstado } from '@/lib/constants/estados'

// Las 6 etapas de RNF03, marcando la actual según el estado de la orden
export default function EtapaStepper({ estado, vertical = false, pasoPorRepuesto = false }) {
  if (estado === 'cancelada') return null
  const actual = ETAPAS.indexOf(etapaEstado(estado))
  const idxRepuesto = ETAPAS.indexOf('Esperando repuesto')
  const omitidos = !pasoPorRepuesto && actual > idxRepuesto ? [idxRepuesto] : []
  return <Stepper steps={ETAPAS} current={actual} omitidos={omitidos} vertical={vertical} />
}
