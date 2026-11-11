import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import MoneyInput from '@/components/ui/MoneyInput'
import Checkbox from '@/components/ui/Checkbox'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { useConfirm } from '@/hooks/core/useConfirm'
import { useToast } from '@/hooks/core/useToast'
import { catalogosService } from '@/services/catalogosService'
import { traducirError } from '@/lib/errors'
import { formatCLP } from '@/lib/format'

function TareaModal({ tarea, onClose, onGuardado }) {
  const [f, setF] = useState({ nombre: tarea?.nombre ?? '', descripcion: tarea?.descripcion ?? '', valor: tarea?.valor_mano_obra_ref ?? null, activo: tarea?.activo ?? true })
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  const guardar = async () => {
    if (!f.nombre.trim()) return setError('El nombre es obligatorio.')
    setPending(true)
    const { error: e } = await catalogosService.guardarTarea({ id: tarea?.id, nombre: f.nombre, descripcion: f.descripcion, valor_mano_obra_ref: f.valor, activo: f.activo })
    setPending(false)
    if (e) return setError(traducirError(e))
    onGuardado()
  }

  return (
    <Modal
      open
      titulo={tarea?.id ? 'Editar tarea' : 'Nueva tarea'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={pending} onClick={guardar}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="stack">
        <FormField label="Nombre" htmlFor="t-nombre" required error={error}>
          <Input id="t-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
        </FormField>
        <FormField label="Descripción" htmlFor="t-desc">
          <TextArea id="t-desc" rows={2} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
        </FormField>
        <FormField label="Valor de referencia de mano de obra" htmlFor="t-valor" hint="Se usa como sugerencia al armar presupuestos.">
          <MoneyInput id="t-valor" value={f.valor} onChange={(v) => setF({ ...f, valor: v })} />
        </FormField>
        <Checkbox id="t-activo" label="Activa (aparece en el checklist del mecánico)" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />
      </div>
    </Modal>
  )
}

function CategoriaModal({ categoria, onClose, onGuardado }) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const guardar = async () => {
    if (!nombre.trim()) return setError('El nombre es obligatorio.')
    setPending(true)
    const { error: e } = await catalogosService.guardarCategoria({ id: categoria?.id, nombre })
    setPending(false)
    if (e) return setError(traducirError(e))
    onGuardado()
  }
  return (
    <Modal
      open
      size="sm"
      titulo={categoria?.id ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={pending} onClick={guardar}>
            Guardar
          </Button>
        </>
      }
    >
      <FormField label="Nombre" htmlFor="c-nombre" required error={error}>
        <Input id="c-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </FormField>
    </Modal>
  )
}

export default function CatalogosPage() {
  const [tab, setTab] = useState('tareas')
  const [editTarea, setEditTarea] = useState(null)
  const [editCat, setEditCat] = useState(null)
  const toast = useToast()
  const { confirm, dialogProps } = useConfirm()
  const { categorias, reload } = useCatalogos()
  const tareas = useSupabaseQuery(() => catalogosService.todasLasTareas(), [], { initialData: [] })

  const guardado = (msg) => {
    toast.success(msg)
    tareas.refetch({ silencioso: true })
    reload()
  }

  const eliminarCategoria = async (c) => {
    const ok = await confirm({ titulo: 'Eliminar categoría', mensaje: `Los repuestos de "${c.nombre}" quedarán sin categoría.`, confirmarTexto: 'Eliminar', peligro: true })
    if (!ok) return
    const { error } = await catalogosService.eliminarCategoria(c.id)
    if (error) return toast.error(traducirError(error))
    guardado('Categoría eliminada')
  }

  return (
    <>
      <PageHeader
        titulo="Catálogos"
        acciones={
          <Button variant="primary" onClick={() => (tab === 'tareas' ? setEditTarea({}) : setEditCat({}))}>
            {tab === 'tareas' ? 'Nueva tarea' : 'Nueva categoría'}
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'tareas', label: 'Tareas tipo (checklist)' },
          { value: 'categorias', label: 'Categorías de repuesto' },
        ]}
      />
      <Card padding={false}>
        {tab === 'tareas' ? (
          <DataTable
            loading={tareas.loading}
            error={tareas.error}
            onRetry={tareas.refetch}
            rows={tareas.data}
            emptyMessage="Sin tareas. Crea las más frecuentes del taller."
            onRowClick={setEditTarea}
            columns={[
              { key: 'nombre', header: 'Tarea', render: (t) => <strong>{t.nombre}</strong> },
              { key: 'descripcion', header: 'Descripción', render: (t) => t.descripcion ?? '—' },
              { key: 'valor', header: 'Valor ref.', align: 'right', render: (t) => (t.valor_mano_obra_ref != null ? formatCLP(t.valor_mano_obra_ref) : '—') },
              { key: 'activo', header: 'Estado', render: (t) => <Badge tono={t.activo ? 'success' : 'neutral'}>{t.activo ? 'Activa' : 'Inactiva'}</Badge> },
            ]}
          />
        ) : (
          <DataTable
            rows={categorias}
            emptyMessage="Sin categorías"
            columns={[
              { key: 'nombre', header: 'Categoría', render: (c) => <strong>{c.nombre}</strong> },
              {
                key: 'acc',
                header: '',
                align: 'right',
                render: (c) => (
                  <span className="row-wrap">
                    <Button size="sm" onClick={() => setEditCat(c)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => eliminarCategoria(c)}>
                      Eliminar
                    </Button>
                  </span>
                ),
              },
            ]}
          />
        )}
      </Card>
      {editTarea && (
        <TareaModal
          tarea={editTarea}
          onClose={() => setEditTarea(null)}
          onGuardado={() => {
            setEditTarea(null)
            guardado('Tarea guardada')
          }}
        />
      )}
      {editCat && (
        <CategoriaModal
          categoria={editCat}
          onClose={() => setEditCat(null)}
          onGuardado={() => {
            setEditCat(null)
            guardado('Categoría guardada')
          }}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </>
  )
}
