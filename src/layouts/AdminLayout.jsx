import AppShell from './AppShell'
import { adminNav } from './nav/adminNav'
import { useNavBadges } from './nav/useNavBadges'
import { ROLES } from '@/lib/constants/roles'

export default function AdminLayout() {
  const badges = useNavBadges(ROLES.ADMIN)
  return <AppShell variant="sidebar" nav={adminNav} badges={badges} homeTo="/admin" search theme="admin" />
}
