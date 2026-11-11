import { useState } from 'react'
import { useAuth } from '@/hooks/core/useAuth'
import { useToast } from '@/hooks/core/useToast'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ETIQUETA_ROL } from '@/lib/constants/roles'

export default function MiCuentaPage() {
  const { perfil, rol, updatePassword } = useAuth()
  const toast = useToast()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (pw.length < 8) return setError('Mínimo 8 caracteres.')
    if (pw !== pw2) return setError('Las contraseñas no coinciden.')
    setError(null)
    setPending(true)
    const r = await updatePassword(pw)
    setPending(false)
    if (!r.ok) return setError(r.error)
    setPw('')
    setPw2('')
    toast.success('Contraseña actualizada.')
  }

  return (
    <>
      <PageHeader titulo="Mi cuenta" />
      <div className="grid-2">
        <Card titulo="Datos">
          <dl className="dl">
            <dt>Nombre</dt>
            <dd>{perfil?.nombre_completo}</dd>
            <dt>Correo</dt>
            <dd>{perfil?.correo}</dd>
            <dt>Rol</dt>
            <dd>{ETIQUETA_ROL[rol]}</dd>
          </dl>
          <p className="muted small">Para cambiar tu nombre o rol, pídelo al administrador.</p>
        </Card>
        <Card titulo="Cambiar contraseña">
          <form className="stack" onSubmit={onSubmit} noValidate>
            <FormField label="Nueva contraseña" htmlFor="pw" required>
              <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </FormField>
            <FormField label="Repite la contraseña" htmlFor="pw2" required error={error}>
              <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </FormField>
            <div>
              <Button type="submit" variant="primary" loading={pending}>
                Guardar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  )
}
