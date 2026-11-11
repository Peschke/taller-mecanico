import Badge from '@/components/ui/Badge'
import { etiquetaEstado, tonoEstado } from '@/lib/constants/estados'

export default function EstadoBadge({ estado, texto }) {
  return <Badge tono={tonoEstado(estado)}>{texto ?? etiquetaEstado(estado)}</Badge>
}
