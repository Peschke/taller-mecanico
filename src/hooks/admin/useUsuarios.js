import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { usuariosService } from '@/services/usuariosService'

export function useUsuarios() {
  const lista = useSupabaseQuery(() => usuariosService.listar(), [], { initialData: [] })
  const crearM = useSupabaseMutation((datos) => usuariosService.crear(datos))
  const actM = useSupabaseMutation((id, datos) => usuariosService.actualizar(id, datos))

  const tras = async (r) => {
    if (r.ok) await lista.refetch({ silencioso: true })
    return r
  }

  return {
    usuarios: lista.data ?? [],
    loading: lista.loading,
    error: lista.error,
    refetch: lista.refetch,
    crear: async (d) => tras(await crearM.mutate(d)),
    actualizar: async (id, d) => tras(await actM.mutate(id, d)),
    pending: crearM.pending || actM.pending,
  }
}
