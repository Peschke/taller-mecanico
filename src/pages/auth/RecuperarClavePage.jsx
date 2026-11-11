import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PATHS } from '@/routes/paths'

export default function RecuperarClavePage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Ingresa tu correo.')
      return
    }
    setPending(true)
    const r = await resetPassword(email)
    setPending(false)
    // Mismo mensaje exista o no el correo, salvo errores de red o límite de intentos
    if (!r.ok && /conexión|intentos/.test(r.error)) setError(r.error)
    else setEnviado(true)
  }

  return (
    <>
      <h1 className="auth-card__title">Recuperar contraseña</h1>
      {enviado ? (
        <p>Si el correo pertenece a una cuenta del taller, recibirás un enlace para crear una nueva contraseña.</p>
      ) : (
        <form className="stack" onSubmit={onSubmit} noValidate>
          <FormField label="Correo" htmlFor="email" required error={error}>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <Button type="submit" variant="primary" size="lg" block loading={pending}>
            Enviar enlace
          </Button>
        </form>
      )}
      <div className="auth-card__links">
        <Link to={PATHS.login}>Volver al ingreso</Link>
      </div>
    </>
  )
}
