import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import MoneyInput from '@/components/ui/MoneyInput'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import FormField from '@/components/ui/FormField'
import { formatCLP } from '@/lib/format'

const TIPO_LABEL = { repuesto: 'Repuesto', mano_obra: 'Mano de obra', otro: 'Otro' }

function FilaItem({ item, editable, mostrarCostos, onUpdate, onDelete }) {
  const [cantidad, setCantidad] = useState(String(item.cantidad))
  const [precio, setPrecio] = useState(Number(item.precio_unitario))
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setCantidad(String(item.cantidad))
    setPrecio(Number(item.precio_unitario))
  }, [item.cantidad, item.precio_unitario])

  const guardar = async () => {
    const c = Number(String(cantidad).replace(',', '.'))
    if (!c || c <= 0) {
      setCantidad(String(item.cantidad))
      return
    }
    if (c === Number(item.cantidad) && precio === Number(item.precio_unitario)) return
    setGuardando(true)
    await onUpdate(item.id, { cantidad: c, precio_unitario: precio ?? 0 })
    setGuardando(false)
  }

  const margen = Number(item.precio_unitario) - Number(item.costo_unitario)

  return (
    <tr>
      <td>
        <Badge tono={item.tipo === 'mano_obra' ? 'info' : 'neutral'}>{TIPO_LABEL[item.tipo]}</Badge>
      </td>
      <td>{item.descripcion}</td>
      <td style={{ width: 100 }}>
        {editable ? (
          <Input aria-label="Cantidad" inputMode="decimal" value={cantidad} onChange={(e) => setCantidad(e.target.value)} onBlur={guardar} />
        ) : (
          Number(item.cantidad)
        )}
      </td>
      {mostrarCostos && <td className="num">{item.tipo === 'repuesto' ? formatCLP(item.costo_unitario) : '—'}</td>}
      <td style={{ width: 160 }}>
        {editable ? (
          <MoneyInput aria-label="Precio unitario" value={precio} onChange={setPrecio} onBlur={guardar} />
        ) : (
          formatCLP(item.precio_unitario)
        )}
      </td>
      {mostrarCostos && <td className={['num', margen < 0 && 'text-danger'].filter(Boolean).join(' ')}>{item.tipo === 'repuesto' ? formatCLP(margen) : '—'}</td>}
      <td className="num">
        <strong>{formatCLP(item.subtotal)}</strong>
      </td>
      {editable && (
        <td>
          <Button size="sm" variant="ghost" loading={guardando} onClick={() => onDelete(item.id)} aria-label={`Quitar ${item.descripcion}`}>
            Quitar
          </Button>
        </td>
      )}
    </tr>
  )
}

function NuevoItem({ onAdd }) {
  const [tipo, setTipo] = useState('mano_obra')
  const [descripcion, setDescripcion] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [precio, setPrecio] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  const agregar = async (e) => {
    e.preventDefault()
    const c = Number(cantidad.replace(',', '.'))
    if (!descripcion.trim()) return setError('Escribe una descripción.')
    if (!c || c <= 0) return setError('Cantidad inválida.')
    if (precio == null) return setError('Ingresa el precio.')
    setPending(true)
    const r = await onAdd({ tipo, descripcion: descripcion.trim(), cantidad: c, precio_unitario: precio, orden_visual: tipo === 'mano_obra' ? 900 : 500 })
    setPending(false)
    if (!r.ok) return setError(r.error)
    setDescripcion('')
    setCantidad('1')
    setPrecio(null)
    setError(null)
  }

  return (
    <form className="inline-form" onSubmit={agregar}>
      <FormField label="Tipo" htmlFor="ni-tipo">
        <Select
          id="ni-tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          options={[
            { value: 'mano_obra', label: 'Mano de obra' },
            { value: 'otro', label: 'Otro' },
          ]}
        />
      </FormField>
      <FormField label="Descripción" htmlFor="ni-desc" className="grow">
        <Input id="ni-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </FormField>
      <FormField label="Cantidad" htmlFor="ni-cant">
        <Input id="ni-cant" inputMode="decimal" value={cantidad} onChange={(e) => setCantidad(e.target.value)} style={{ width: 90 }} />
      </FormField>
      <FormField label="Precio unitario" htmlFor="ni-precio">
        <MoneyInput id="ni-precio" value={precio} onChange={setPrecio} />
      </FormField>
      <Button type="submit" loading={pending}>
        Agregar ítem
      </Button>
      {error && (
        <p className="form-error full" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

/**
 * items: filas de presupuesto_items. editable solo para borradores (el trigger también lo exige).
 */
export default function PresupuestoEditor({ items, editable, mostrarCostos = true, onUpdateItem, onDeleteItem, onAddItem }) {
  return (
    <div className="stack">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Cant.</th>
              {mostrarCostos && <th className="num">Costo unit.</th>}
              <th>Precio unit.</th>
              {mostrarCostos && <th className="num">Margen unit.</th>}
              <th className="num">Subtotal</th>
              {editable && <th aria-label="Acciones" />}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <FilaItem key={it.id} item={it} editable={editable} mostrarCostos={mostrarCostos} onUpdate={onUpdateItem} onDelete={onDeleteItem} />
            ))}
            {!items.length && (
              <tr>
                <td colSpan={8} className="muted">
                  El presupuesto no tiene ítems.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editable && <NuevoItem onAdd={onAddItem} />}
    </div>
  )
}
