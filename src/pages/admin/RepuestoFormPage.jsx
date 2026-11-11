import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import ErrorState from '@/components/ui/ErrorState'
import RepuestoForm from '@/components/domain/inventario/RepuestoForm'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { useToast } from '@/hooks/core/useToast'
import { inventarioService } from '@/services/inventarioService'

// CU-10 · RF27: alta con stock inicial, costo y precio; edición de datos y precio
export default function RepuestoFormPage() {
  const { repuestoId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { categorias } = useCatalogos()
  const editando = Boolean(repuestoId)

  const rep = useSupabaseQuery(() => inventarioService.obtenerRepuesto(repuestoId), [repuestoId], { enabled: editando })
  const guardar = useSupabaseMutation((datos) =>
    editando ? inventarioService.actualizarRepuesto(repuestoId, datos) : inventarioService.crearRepuesto(datos),
  )

  if (editando && rep.loading && !rep.data) return <SplashScreen />
  if (editando && rep.error) return <ErrorState mensaje={rep.error} onRetry={rep.refetch} />

  const onSubmit = async (datos) => {
    const r = await guardar.mutate(datos)
    if (!r.ok) return toast.error(r.error.includes('Ya existe') ? 'Ya existe un repuesto con ese código.' : r.error)
    toast.success(editando ? 'Repuesto actualizado' : 'Repuesto registrado')
    navigate(`/admin/inventario/${r.data.id}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Inventario', to: '/admin/inventario' }, { label: editando ? rep.data?.nombre ?? 'Editar' : 'Nuevo repuesto' }]} />
      <PageHeader titulo={editando ? 'Editar repuesto' : 'Ingresar repuesto'} />
      <Card>
        <RepuestoForm inicial={editando ? rep.data : null} categorias={categorias} onSubmit={onSubmit} pending={guardar.pending} onCancel={() => navigate(-1)} />
      </Card>
    </>
  )
}
