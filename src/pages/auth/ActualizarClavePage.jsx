import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import { useToast } from '@/hooks/core/useToast'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import SplashScreen from '@/components/layout/SplashScreen'
import RedirectByRole from '@/routes/guards/RedirectByRole'
import { PATHS } from '@/routes/paths'

export default function ActualizarClavePage() {
  const { status, session, updatePassword } = useAuth()
  const toast = useToast()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [listo, setListo] = useState(false)

  if (status === 'loading') return <SplashScreen />
  if (listo) return <RedirectByRole />

  if (!session) {
    return (
      <>
        <h1 className="auth-card__title">Enlace no válido</h1>
        <p className="muted">El enlace para cambiar la contraseña expiró o ya fue usado.</p>
        <div className="auth-card__links">
          <Link to={PATHS.recuperarClave}>Pedir un enlace nuevo</Link>
        </div>
      </>
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (pw.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (pw !== pw2) return setError('Las contraseñas no coinciden.')
    setError(null)
    setPending(true)
    const r = await updatePassword(pw)
    setPending(false)
    if (!r.ok) return setError(r.error)
    toast.success('Contraseña actualizada.')
    setListo(true)
  }

  return (
    <>
      <h1 className="auth-card__title">Nueva contraseña</h1>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <FormField label="Nueva contraseña" htmlFor="pw" required hint="Mínimo 8 caracteres.">
          <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </FormField>
        <FormField label="Repite la contraseña" htmlFor="pw2" required error={error}>
          <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </FormField>
        <Button type="submit" variant="primary" size="lg" block loading={pending}>
          Guardar contraseña
        </Button>
      </form>
    </>
  )
}
