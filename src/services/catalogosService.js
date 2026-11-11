import { supabase } from '@/lib/supabaseClient'

export const catalogosService = {
  transiciones: () => supabase.from('transiciones_estado').select('origen, destino, roles'),

  categorias: () => supabase.from('categorias_repuesto').select('id, nombre').order('nombre'),

  tareas: () =>
    supabase.from('catalogo_tareas').select('id, nombre, descripcion, valor_mano_obra_ref, activo').eq('activo', true).order('nombre'),

  // Administración de catálogos (CatalogosPage)
  todasLasTareas: () => supabase.from('catalogo_tareas').select('id, nombre, descripcion, valor_mano_obra_ref, activo').order('nombre'),

  guardarTarea: ({ id, nombre, descripcion, valor_mano_obra_ref, activo }) => {
    const fila = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      valor_mano_obra_ref: valor_mano_obra_ref ?? null,
      activo: activo ?? true,
    }
    return id ? supabase.from('catalogo_tareas').update(fila).eq('id', id) : supabase.from('catalogo_tareas').insert(fila)
  },

  guardarCategoria: ({ id, nombre }) =>
    id
      ? supabase.from('categorias_repuesto').update({ nombre: nombre.trim() }).eq('id', id)
      : supabase.from('categorias_repuesto').insert({ nombre: nombre.trim() }),

  eliminarCategoria: (id) => supabase.from('categorias_repuesto').delete().eq('id', id),
}
