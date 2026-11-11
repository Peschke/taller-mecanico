import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PATHS } from '@/routes/paths'

export default function LoginPersonalPage() {
  const { signInStaff, session, tipoCuenta } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  // Sesión iniciada pero sin perfil activo → pantalla de sin acceso
  useEffect(() => {
    if (session && tipoCuenta === 'sin_acceso') navigate(PATHS.sinAcceso, { replace: true })
  }, [session, tipoCuenta, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setPending(true)
    const r = await signInStaff(email, password)
    setPending(false)
    if (!r.ok) setError(r.error)
    // Si funciona, PublicOnly redirige a la home del rol
  }

  return (
    <>
      <h1 className="auth-card__title">Ingreso del personal</h1>
      <p className="muted">Administración, recepción y taller.</p>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <FormField label="Correo" htmlFor="email" required>
          <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Contraseña" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" block loading={pending}>
          Ingresar
        </Button>
      </form>
      <div className="auth-card__links">
        <Link to={PATHS.recuperarClave}>Olvidé mi contraseña</Link>
        <Link to={PATHS.accesoCliente}>Soy cliente</Link>
      </div>
    </>
  )
}
