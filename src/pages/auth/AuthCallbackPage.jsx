import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/core/useAuth'
import SplashScreen from '@/components/layout/SplashScreen'
import RedirectByRole from '@/routes/guards/RedirectByRole'
import { PATHS } from '@/routes/paths'

// supabase-js (detectSessionInUrl + PKCE) canjea el código de la URL al iniciar
export default function AuthCallbackPage() {
  const { status, session } = useAuth()
  const [expirado, setExpirado] = useState(false)

  const params = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const errorUrl = params.get('error_description') || hash.get('error_description')

  useEffect(() => {
    const t = setTimeout(() => setExpirado(true), 8000)
    return () => clearTimeout(t)
  }, [])

  if (session && status === 'ready') return <RedirectByRole />

  if (errorUrl || expirado) {
    return (
      <>
        <h1 className="auth-card__title">No pudimos validar el enlace</h1>
        <p className="muted">{errorUrl ?? 'El enlace expiró o ya fue usado.'}</p>
        <div className="auth-card__links">
          <Link to={PATHS.accesoCliente}>Pedir un enlace nuevo</Link>
          <Link to={PATHS.seguimiento}>Seguir con código</Link>
        </div>
      </>
    )
  }

  return <SplashScreen mensaje="Validando tu acceso…" />
}
