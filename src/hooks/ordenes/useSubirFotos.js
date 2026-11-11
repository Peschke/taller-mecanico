import { useCallback, useEffect, useRef, useState } from 'react'
import { fotosService } from '@/services/fotosService'
import { validarFoto } from '@/lib/storagePaths'

let seq = 0

/**
 * Cola de fotos con vista previa, eliminación antes de guardar y progreso por archivo (RF06, RNF07).
 * item: { id, file, preview, progreso, estado: 'pendiente'|'subiendo'|'ok'|'error', error }
 */
export function useSubirFotos({ maximo = 12 } = {}) {
  const [items, setItems] = useState([])
  const [rechazos, setRechazos] = useState([])
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Libera las URL de vista previa al desmontar
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), [])

  const actualizar = (id, cambios) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...cambios } : x)))

  const agregar = useCallback(
    (files) => {
      const nuevos = []
      const malos = []
      for (const file of files) {
        const err = validarFoto(file)
        if (err) malos.push(`${file.name}: ${err}`)
        else nuevos.push({ id: `f${(seq += 1)}`, file, preview: URL.createObjectURL(file), progreso: 0, estado: 'pendiente', error: null })
      }
      const libres = Math.max(0, maximo - itemsRef.current.length)
      if (nuevos.length > libres) {
        malos.push(`Máximo ${maximo} fotos por carga.`)
        nuevos.slice(libres).forEach((n) => URL.revokeObjectURL(n.preview))
      }
      const aceptados = nuevos.slice(0, libres)
      setItems((xs) => [...xs, ...aceptados])
      setRechazos(malos)
    },
    [maximo],
  )

  const quitar = useCallback((id) => {
    setItems((xs) => {
      const it = xs.find((x) => x.id === id)
      if (it) URL.revokeObjectURL(it.preview)
      return xs.filter((x) => x.id !== id)
    })
  }, [])

  const limpiar = useCallback(() => {
    itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview))
    setItems([])
    setRechazos([])
  }, [])

  // Sube las pendientes (o con error) de a 3 en paralelo. Devuelve { ok, fallidas }.
  const subirTodas = useCallback(async (ordenId, tipo = 'ingreso') => {
    const cola = itemsRef.current.filter((i) => i.estado === 'pendiente' || i.estado === 'error')
    let fallidas = 0
    const trabajar = async () => {
      while (cola.length) {
        const it = cola.shift()
        actualizar(it.id, { estado: 'subiendo', progreso: 0, error: null })
        const { error } = await fotosService.subirConProgreso(ordenId, it.file, { tipo, onProgress: (p) => actualizar(it.id, { progreso: p }) })
        if (error) {
          fallidas += 1
          actualizar(it.id, { estado: 'error', error: error.message })
        } else actualizar(it.id, { estado: 'ok', progreso: 100 })
      }
    }
    await Promise.all([trabajar(), trabajar(), trabajar()])
    return { ok: fallidas === 0, fallidas }
  }, [])

  const subiendo = items.some((i) => i.estado === 'subiendo')
  const progresoTotal = items.length ? Math.round(items.reduce((s, i) => s + i.progreso, 0) / items.length) : 0

  return { items, rechazos, agregar, quitar, limpiar, subirTodas, subiendo, progresoTotal }
}
