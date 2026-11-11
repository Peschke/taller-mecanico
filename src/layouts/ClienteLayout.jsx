import AppShell from './AppShell'

// El cliente no marca notificaciones (RLS); sin campana
export default function ClienteLayout() {
  return <AppShell variant="simple" homeTo="/cliente" bell={false} theme="cliente" />
}
