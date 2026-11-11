import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClickOutside } from './useClickOutside'
import { useDebounce } from '@/hooks/core/useDebounce'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useAuth } from '@/hooks/core/useAuth'
import { vehiculosService } from '@/services/vehiculosService'
import { clientesService } from '@/services/clientesService'
import { recepcionService } from '@/services/recepcionService'
import { formatearRut } from '@/lib/rut'
import { etiquetaEstado } from '@/lib/constants/estados'
import { rutaOrden } from '@/routes/paths'

const VACIO = { ordenes: [], vehiculos: [], clientes: [] }

// RNF05: buscador global por cliente, RUT, teléfono, vehículo, patente u orden (recepción y admin)
export default function GlobalSearch() {
  const [q, setQ] = useState('')
  const [res, setRes] = useState(VACIO)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activo, setActivo] = useState(-1)
  const debounced = useDebounce(q.trim(), 300)
  const base = useBasePath()
  const { rol } = useAuth()
  const navigate = useNavigate()
  const ref = useRef(null)
  const cerrar = useCallback(() => setOpen(false), [])
  useClickOutside(ref, cerrar, open)

  useEffect(() => {
    if (debounced.length < 2) {
      setRes(VACIO)
      return
    }
    let cancel = false
    setLoading(true)
    setOpen(true)
    Promise.all([recepcionService.buscarOrdenes(debounced, 5), vehiculosService.buscar(debounced, 5), clientesService.buscar(debounced, 5)])
      .then(([o, v, c]) => {
        if (cancel) return
        setRes({ ordenes: o.data ?? [], vehiculos: v.data ?? [], clientes: c.data ?? [] })
      })
      .catch(() => !cancel && setRes(VACIO))
      .finally(() => {
        if (cancel) return
        setLoading(false)
        setActivo(-1)
      })
    return () => {
      cancel = true
    }
  }, [debounced])

  const items = [
    ...res.ordenes.map((o) => ({
      key: `o-${o.id}`,
      grupo: 'Órdenes',
      to: rutaOrden(rol, o.id),
      titulo: o.codigo,
      detalle: `${o.vehiculos?.patente ?? ''} · ${o.clientes?.nombre ?? ''} · ${etiquetaEstado(o.estado)}`,
    })),
    ...res.vehiculos.map((v) => ({
      key: `v-${v.id}`,
      grupo: 'Vehículos',
      to: `${base}/vehiculos/${v.id}`,
      titulo: v.patente,
      detalle: `${v.marca} ${v.modelo} ${v.anio ?? ''} · ${v.clientes?.nombre ?? ''}`,
    })),
    ...res.clientes.map((c) => ({
      key: `c-${c.id}`,
      grupo: 'Clientes',
      to: `${base}/clientes/${c.id}`,
      titulo: c.nombre,
      detalle: `${formatearRut(c.rut)} · ${c.telefono ?? ''}`,
    })),
  ]

  const ir = (to) => {
    setOpen(false)
    setQ('')
    navigate(to)
  }

  const onKeyDown = (e) => {
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((i) => (i <= 0 ? items.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      ir(items[Math.max(0, activo)].to)
    } else if (e.key === 'Escape') setOpen(false)
  }

  const vacio = !loading && debounced.length >= 2 && !items.length

  return (
    <div className="global-search dropdown" ref={ref}>
      <input
        type="search"
        className="input"
        placeholder="Buscar cliente, RUT, patente u orden…"
        aria-label="Buscar cliente, RUT, teléfono, patente u orden"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => debounced.length >= 2 && setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <div className="dropdown__panel dropdown__panel--wide" role="listbox">
          {loading && !items.length && <p className="muted dropdown__empty">Buscando…</p>}
          {vacio && (
            <div className="dropdown__empty">
              <p className="muted">Sin resultados para “{debounced}”.</p>
              <button type="button" className="link-btn" onClick={() => ir(`${base}/registro?patente=${encodeURIComponent(debounced)}`)}>
                Registrar cliente y vehículo
              </button>
            </div>
          )}
          {items.map((it, i) => (
            <div key={it.key}>
              {(i === 0 || items[i - 1].grupo !== it.grupo) && <div className="dropdown__group">{it.grupo}</div>}
              <button
                type="button"
                role="option"
                aria-selected={i === activo}
                className={['dropdown__item', i === activo && 'dropdown__item--active'].filter(Boolean).join(' ')}
                onMouseEnter={() => setActivo(i)}
                onClick={() => ir(it.to)}
              >
                <strong>{it.titulo}</strong>
                <span className="muted">{it.detalle}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
