import { useEffect, useState } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useDebounce } from '@/hooks/core/useDebounce'
import { clientesService } from '@/services/clientesService'
import { rutValido } from '@/lib/rut'

// Listado paginado con búsqueda por RUT, nombre o teléfono
export function useClientes({ texto = '', page = 0, pageSize = 20 } = {}) {
  const q = useSupabaseQuery(
    () => clientesService.listar({ texto: texto || undefined, rango: [page * pageSize, page * pageSize + pageSize - 1] }),
    [texto, page, pageSize],
    { initialData: [] },
  )
  return { ...q, clientes: q.data ?? [], total: q.count }
}

// Ficha del cliente: datos, vehículos, órdenes, monto facturado y últimos trabajos
export function useCliente(clienteId) {
  const q = useSupabaseQuery(
    async () => {
      const [c, v, o, f, t] = await Promise.all([
        clientesService.obtener(clienteId),
        clientesService.vehiculos(clienteId),
        clientesService.ordenes(clienteId),
        clientesService.facturado(clienteId),
        clientesService.ultimosTrabajos(clienteId),
      ])
      const err = c.error || v.error || o.error || f.error || t.error
      if (err) throw err
      return { cliente: c.data, vehiculos: v.data, ordenes: o.data, facturado: f.data, trabajos: t.data }
    },
    [clienteId],
    { enabled: Boolean(clienteId) },
  )
  return { ...q, ficha: q.data }
}

// RUT en tiempo real: { estado: 'vacio'|'invalido'|'buscando'|'existe'|'nuevo', cliente }
export function useClientePorRut(rut, { enabled = true } = {}) {
  const debounced = useDebounce(rut, 400)
  const [res, setRes] = useState({ estado: 'vacio', cliente: null })

  useEffect(() => {
    if (!enabled) return undefined
    if (!debounced?.trim()) return setRes({ estado: 'vacio', cliente: null })
    if (!rutValido(debounced)) return setRes({ estado: 'invalido', cliente: null })
    let cancel = false
    setRes({ estado: 'buscando', cliente: null })
    clientesService.obtenerPorRut(debounced).then(({ data }) => {
      if (!cancel) setRes({ estado: data ? 'existe' : 'nuevo', cliente: data ?? null })
    })
    return () => {
      cancel = true
    }
  }, [debounced, enabled])

  return res
}

export function useGuardarCliente() {
  const crear = useSupabaseMutation((datos) => clientesService.crear(datos))
  const actualizar = useSupabaseMutation((id, datos) => clientesService.actualizarContacto(id, datos))
  return { crear: crear.mutate, actualizar: actualizar.mutate, pending: crear.pending || actualizar.pending }
}
