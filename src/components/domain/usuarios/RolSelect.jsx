import Select from '@/components/ui/Select'
import { ETIQUETA_ROL, ROLES_STAFF } from '@/lib/constants/roles'

export default function RolSelect(props) {
  return <Select options={ROLES_STAFF.map((r) => ({ value: r, label: ETIQUETA_ROL[r] }))} {...props} />
}
