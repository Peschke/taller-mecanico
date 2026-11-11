import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClickOutside } from './useClickOutside'
import Icon from './Icon'
import { useAuth } from '@/hooks/core/useAuth'
import { ETIQUETA_ROL } from '@/lib/constants/roles'
import { rutaMiCuenta } from '@/routes/paths'

export default function UserMenu() {
  const { perfil, cliente, rol, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const cerrar = useCallback(() => setOpen(false), [])
  useClickOutside(ref, cerrar, open)

  const nombre = perfil?.nombre_completo ?? cliente?.nombre ?? 'Usuario'
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  const salir = async () => {
    setOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="user-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden="true">
          {iniciales}
        </span>
        <span className="user-btn__text">
          <span className="user-btn__name">{nombre}</span>
          <span className="user-btn__role">{ETIQUETA_ROL[rol]}</span>
        </span>
      </button>
      {open && (
        <div className="dropdown__panel" role="menu">
          {rol !== 'cliente' && (
            <Link role="menuitem" className="dropdown__item" to={rutaMiCuenta(rol)} onClick={cerrar}>
              Mi cuenta
            </Link>
          )}
          <button type="button" role="menuitem" className="dropdown__item" onClick={salir}>
            <Icon name="salir" size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
