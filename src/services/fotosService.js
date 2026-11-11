import { supabase } from '@/lib/supabaseClient'
import { BUCKET_FOTOS, rutaFoto } from '@/lib/storagePaths'

const URL_BASE = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sube al endpoint REST de Storage con XMLHttpRequest para poder informar el progreso (RNF07)
function subirArchivo(path, file, onProgress) {
  return new Promise((resolve) => {
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token
      if (!token) {
        resolve({ error: { message: 'Tu sesión expiró. Vuelve a ingresar.' } })
        return
      }
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${URL_BASE}/storage/v1/object/${BUCKET_FOTOS}/${path.split('/').map(encodeURIComponent).join('/')}`)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.setRequestHeader('apikey', ANON)
      xhr.setRequestHeader('x-upsert', 'false')
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.setRequestHeader('cache-control', 'max-age=3600')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve({ error: null })
        else {
          let msg = 'No se pudo subir la foto.'
          try {
            msg = JSON.parse(xhr.responseText).message ?? msg
          } catch {
            /* respuesta no JSON */
          }
          resolve({ error: { message: msg, status: xhr.status } })
        }
      }
      xhr.onerror = () => resolve({ error: { message: 'Sin conexión al subir la foto.' } })
      xhr.send(file)
    })
  })
}

export const fotosService = {
  // Lista las fotos con URL firmada (el bucket es privado)
  async listarConUrls(ordenId, segundos = 3600) {
    const { data, error } = await supabase
      .from('fotos_orden')
      .select('id, storage_path, tipo, descripcion, created_at')
      .eq('orden_id', ordenId)
      .order('created_at')
    if (error) return { data: null, error }
    if (!data.length) return { data: [], error: null }
    const { data: firmadas, error: e2 } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrls(
      data.map((f) => f.storage_path),
      segundos,
    )
    if (e2) return { data: null, error: e2 }
    const porRuta = Object.fromEntries((firmadas ?? []).map((f) => [f.path, f.signedUrl]))
    return { data: data.map((f) => ({ ...f, url: porRuta[f.storage_path] ?? null })), error: null }
  },

  // RF06: archivo a fotos-ordenes/{orden_id}/{uuid}.ext y luego la fila en fotos_orden
  async subirConProgreso(ordenId, file, { tipo = 'ingreso', onProgress } = {}) {
    const path = rutaFoto(ordenId, file)
    const up = await subirArchivo(path, file, onProgress)
    if (up.error) return { data: null, error: up.error }
    const res = await supabase.from('fotos_orden').insert({ orden_id: ordenId, storage_path: path, tipo }).select().single()
    if (res.error) await supabase.storage.from(BUCKET_FOTOS).remove([path])
    return res
  },
}
