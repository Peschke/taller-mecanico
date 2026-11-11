import Badge from '@/components/ui/Badge'

export default function ActivoToggle({ activo }) {
  return <Badge tono={activo ? 'success' : 'neutral'}>{activo ? 'Activo' : 'Desactivado'}</Badge>
}
