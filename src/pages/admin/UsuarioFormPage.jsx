import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import UsuarioForm from '@/components/domain/usuarios/UsuarioForm'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useAuth } from '@/hooks/core/useAuth'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { useToast } from '@/hooks/core/useToast'
import { usuariosService } from '@/services/usuariosService'

// CU-08: crear (RF20, RF22) o editar rol y estado (RF21)
export default function UsuarioFormPage() {
  const { usuarioId } = useParams()
  const editando = Boolean(usuarioId)
  const navigate = useNavigate()
  const toast = useToast()
  const { user, refreshCuenta } = useAuth()
  const { reload: recargarCatalogos } = useCatalogos()

  const u = useSupabaseQuery(() => usuariosService.obtener(usuarioId), [usuarioId], { enabled: editando })
  const guardar = useSupabaseMutation((datos) => (editando ? usuariosService.actualizar(usuarioId, datos) : usuariosService.crear(datos)))

  if (editando && u.loading && !u.data) return <SplashScreen />
  if (editando && u.error) return <ErrorState mensaje={u.error} onRetry={u.refetch} />
  if (editando && !u.data) return <EmptyState mensaje="Usuario no encontrado" />

  const esUnoMismo = editando && usuarioId === user?.id

  const onSubmit = async (f) => {
    const datos = editando
      ? { nombre_completo: f.nombre_completo, telefono: f.telefono, rol: esUnoMismo ? undefined : f.rol, activo: esUnoMismo ? undefined : f.activo }
      : f
    const r = await guardar.mutate(datos)
    if (!r.ok) return toast.error(r.error)
    toast.success(editando ? 'Usuario actualizado' : `Usuario creado. Entrega la clave inicial a ${f.nombre_completo}.`)
    recargarCatalogos()
    if (esUnoMismo) refreshCuenta()
    navigate('/admin/usuarios')
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Usuarios', to: '/admin/usuarios' }, { label: editando ? u.data.nombre_completo : 'Nuevo usuario' }]} />
      <PageHeader titulo={editando ? 'Editar usuario' : 'Crear nuevo usuario'} subtitulo="Recepcionistas, mecánicos y administradores" />
      <Card>
        <UsuarioForm inicial={editando ? u.data : null} esUnoMismo={esUnoMismo} onSubmit={onSubmit} pending={guardar.pending} onCancel={() => navigate('/admin/usuarios')} />
      </Card>
    </>
  )
}
