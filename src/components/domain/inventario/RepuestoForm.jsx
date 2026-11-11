import { useEffect, useState } from 'react'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import MoneyInput from '@/components/ui/MoneyInput'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import { formatCLP } from '@/lib/format'

const VACIO = { codigo: '', nombre: '', categoria_id: '', stock: '0', stock_minimo: '0', costo_promedio: null, precio_venta: null, activo: true }

// CU-10 · RF27. En edición, stock y costo no se tocan (se cambian por movimientos, RF28)
export default function RepuestoForm({ inicial, categorias, onSubmit, pending, onCancel }) {
  const editando = Boolean(inicial?.id)
  const [f, setF] = useState(VACIO)
  const [err, setErr] = useState({})

  useEffect(() => {
    setF(
      inicial
        ? {
            codigo: inicial.codigo,
            nombre: inicial.nombre,
            categoria_id: inicial.categoria_id ?? '',
            stock: String(inicial.stock),
            stock_minimo: String(inicial.stock_minimo),
            costo_promedio: Number(inicial.costo_promedio),
            precio_venta: Number(inicial.precio_venta),
            activo: inicial.activo,
          }
        : VACIO,
    )
  }, [inicial])

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))

  const enviar = (e) => {
    e.preventDefault()
    const v = {}
    if (!f.codigo.trim()) v.codigo = 'Obligatorio.'
    if (!f.nombre.trim()) v.nombre = 'Obligatorio.'
    if (f.precio_venta == null) v.precio_venta = 'Ingresa el precio de venta.'
    const stock = Number(f.stock)
    const minimo = Number(f.stock_minimo)
    if (!editando && (!Number.isInteger(stock) || stock < 0)) v.stock = 'Debe ser un entero ≥ 0.'
    if (!Number.isInteger(minimo) || minimo < 0) v.stock_minimo = 'Debe ser un entero ≥ 0.'
    if (!editando && stock > 0 && !f.costo_promedio) v.costo_promedio = 'Ingresa el costo de compra del stock inicial.'
    setErr(v)
    if (Object.keys(v).length) return
    onSubmit({
      ...f,
      categoria_id: f.categoria_id ? Number(f.categoria_id) : null,
      stock,
      stock_minimo: minimo,
      costo_promedio: f.costo_promedio ?? 0,
    })
  }

  const margen = f.precio_venta && f.costo_promedio ? Math.round(((f.precio_venta - f.costo_promedio) / f.precio_venta) * 100) : null

  return (
    <form className="form-grid" onSubmit={enviar} noValidate>
      <FormField label="Código" htmlFor="codigo" required error={err.codigo}>
        <Input id="codigo" value={f.codigo} onChange={set('codigo')} autoCapitalize="characters" />
      </FormField>
      <FormField label="Nombre" htmlFor="nombre" required error={err.nombre} className="span-2">
        <Input id="nombre" value={f.nombre} onChange={set('nombre')} />
      </FormField>
      <FormField label="Categoría" htmlFor="categoria">
        <Select
          id="categoria"
          value={f.categoria_id}
          onChange={set('categoria_id')}
          placeholder="Sin categoría"
          options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
        />
      </FormField>
      {editando ? (
        <>
          <FormField label="Stock actual" htmlFor="stock-actual" hint="Se modifica con ingresos y ajustes en el kárdex.">
            <Input id="stock-actual" value={f.stock} disabled />
          </FormField>
          <FormField label="Costo promedio" htmlFor="costo-actual" hint="Se recalcula con cada ingreso.">
            <Input id="costo-actual" value={formatCLP(f.costo_promedio)} disabled />
          </FormField>
        </>
      ) : (
        <>
          <FormField label="Stock inicial" htmlFor="stock" required error={err.stock}>
            <Input id="stock" inputMode="numeric" value={f.stock} onChange={set('stock')} />
          </FormField>
          <FormField label="Costo de compra (unitario)" htmlFor="costo" error={err.costo_promedio}>
            <MoneyInput id="costo" value={f.costo_promedio} onChange={set('costo_promedio')} />
          </FormField>
        </>
      )}
      <FormField label="Precio de venta" htmlFor="precio" required error={err.precio_venta} hint={margen != null ? `Margen sobre el precio: ${margen}%` : undefined}>
        <MoneyInput id="precio" value={f.precio_venta} onChange={set('precio_venta')} invalid={!!err.precio_venta} />
      </FormField>
      <FormField label="Stock mínimo" htmlFor="minimo" error={err.stock_minimo} hint="Bajo este número aparece en alertas.">
        <Input id="minimo" inputMode="numeric" value={f.stock_minimo} onChange={set('stock_minimo')} />
      </FormField>
      {editando && <Checkbox id="activo" label="Repuesto activo (visible en el catálogo)" checked={f.activo} onChange={set('activo')} />}
      <div className="form-actions span-all">
        {onCancel && <Button onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" variant="primary" loading={pending}>
          {editando ? 'Guardar cambios' : 'Guardar repuesto'}
        </Button>
      </div>
    </form>
  )
}
