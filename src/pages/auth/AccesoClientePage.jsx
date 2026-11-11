import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PATHS } from '@/routes/paths'

export default function AccesoClientePage() {
  const { signInCliente } = useAuth()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Ingresa un correo válido.')
      return
    }
    setPending(true)
    const r = await signInCliente(email)
    setPending(false)
    if (r.ok) setEnviado(true)
    else setError(r.error)
  }

  if (enviado) {
    return (
      <>
        <h1 className="auth-card__title">Revisa tu correo</h1>
        <p>
          Enviamos un enlace de acceso a <strong>{email.trim().toLowerCase()}</strong>. Ábrelo desde este mismo dispositivo para
          entrar.
        </p>
        <p className="muted">Si no llega en unos minutos, revisa la carpeta de spam.</p>
        <Button onClick={() => setEnviado(false)} block>
          Usar otro correo
        </Button>
      </>
    )
  }

  return (
    <>
      <h1 className="auth-card__title">Acceso de clientes</h1>
      <p className="muted">Usa el correo que registraste en el taller. Te enviaremos un enlace, sin contraseña.</p>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <FormField label="Correo" htmlFor="email" required error={error}>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} />
        </FormField>
        <Button type="submit" variant="primary" size="lg" block loading={pending}>
          Enviar enlace de acceso
        </Button>
      </form>
      <div className="auth-card__links">
        <Link to={PATHS.seguimiento}>Seguir mi vehículo con código</Link>
        <Link to={PATHS.login}>Soy del personal</Link>
      </div>
    </>
  )
}
