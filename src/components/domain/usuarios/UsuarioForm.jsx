import { useEffect, useState } from 'react'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import RolSelect from './RolSelect'

function generarClave() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const arr = new Uint32Array(12)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => chars[n % chars.length]).join('')
}

// CU-08: alta (nombre, correo, rol, clave inicial) y edición (nombre, teléfono, rol, activo)
export default function UsuarioForm({ inicial, esUnoMismo, onSubmit, pending, onCancel }) {
  const editando = Boolean(inicial?.id)
  const [f, setF] = useState({ nombre_completo: '', correo: '', telefono: '', rol: 'recepcionista', password: '', activo: true })
  const [err, setErr] = useState({})
  const [verClave, setVerClave] = useState(false)

  useEffect(() => {
    if (inicial)
      setF({
        nombre_completo: inicial.nombre_completo,
        correo: inicial.correo,
        telefono: inicial.telefono ?? '',
        rol: inicial.rol,
        password: '',
        activo: inicial.activo,
      })
  }, [inicial])

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const enviar = (e) => {
    e.preventDefault()
    const v = {}
    if (!f.nombre_completo.trim()) v.nombre_completo = 'Obligatorio.'
    if (!editando && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.correo.trim())) v.correo = 'Correo inválido.'
    if (!editando && f.password.length < 8) v.password = 'Mínimo 8 caracteres.'
    setErr(v)
    if (Object.keys(v).length) return
    onSubmit(f)
  }

  return (
    <form className="form-grid" onSubmit={enviar} noValidate>
      <FormField label="Nombre completo" htmlFor="u-nombre" required error={err.nombre_completo} className="span-2">
        <Input id="u-nombre" value={f.nombre_completo} onChange={set('nombre_completo')} autoComplete="off" />
      </FormField>
      <FormField label="Correo" htmlFor="u-correo" required={!editando} error={err.correo} hint={editando ? 'El correo no se puede cambiar.' : undefined}>
        <Input id="u-correo" type="email" value={f.correo} onChange={set('correo')} disabled={editando} autoComplete="off" />
      </FormField>
      <FormField label="Teléfono" htmlFor="u-tel">
        <Input id="u-tel" type="tel" value={f.telefono} onChange={set('telefono')} />
      </FormField>
      <FormField label="Rol" htmlFor="u-rol" required hint={esUnoMismo ? 'No puedes cambiar tu propio rol.' : undefined}>
        <RolSelect id="u-rol" value={f.rol} onChange={set('rol')} disabled={esUnoMismo} />
      </FormField>
      {!editando && (
        <FormField label="Clave inicial" htmlFor="u-clave" required error={err.password} hint="Entrégala a la persona; podrá cambiarla en Mi cuenta.">
          <div className="input-group">
            <Input id="u-clave" type={verClave ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete="new-password" />
            <Button
              size="sm"
              onClick={() => {
                setF((x) => ({ ...x, password: generarClave() }))
                setVerClave(true)
              }}
            >
              Generar
            </Button>
          </div>
        </FormField>
      )}
      {editando && !esUnoMismo && <Checkbox id="u-activo" label="Cuenta activa (puede iniciar sesión)" checked={f.activo} onChange={set('activo')} />}
      <div className="form-actions span-all">
        {onCancel && <Button onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" variant="primary" loading={pending}>
          {editando ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}
