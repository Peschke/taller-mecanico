import AppShell from './AppShell'
import { recepcionNav } from './nav/recepcionNav'
import { useNavBadges } from './nav/useNavBadges'
import { ROLES } from '@/lib/constants/roles'

export default function RecepcionLayout() {
  const badges = useNavBadges(ROLES.RECEPCIONISTA)
  return <AppShell variant="sidebar" nav={recepcionNav} badges={badges} homeTo="/recepcion" search theme="recepcion" />
}
