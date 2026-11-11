import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import FormField from '@/components/ui/FormField'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ActivoToggle from '@/components/domain/usuarios/ActivoToggle'
import { useUsuarios } from '@/hooks/admin/useUsuarios'
import { useAuth } from '@/hooks/core/useAuth'
import { useConfirm } from '@/hooks/core/useConfirm'
import { useToast } from '@/hooks/core/useToast'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { ETIQUETA_ROL, ROLES_STAFF } from '@/lib/constants/roles'
import { formatFecha } from '@/lib/format'

const TONO_ROL = { admin: 'info', recepcionista: 'neutral', mecanico: 'warning' }

// CU-08 · Administrar usuarios y permisos
export default function UsuariosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const { reload: recargarCatalogos } = useCatalogos()
  const { confirm, dialogProps } = useConfirm()
  const { usuarios, loading, error, refetch, actualizar, pending } = useUsuarios()
  const [texto, setTexto] = useState('')
  const [rol, setRol] = useState('')

  const filtrados = useMemo(() => {
    const t = texto.toLowerCase()
    return usuarios.filter((u) => (!rol || u.rol === rol) && (!t || u.nombre_completo.toLowerCase().includes(t) || u.correo.includes(t)))
  }, [usuarios, texto, rol])

  const alternar = async (u) => {
    const activar = !u.activo
    const ok = await confirm({
      titulo: activar ? 'Reactivar cuenta' : 'Desactivar cuenta',
      mensaje: activar
        ? `${u.nombre_completo} podrá volver a iniciar sesión.`
        : `${u.nombre_completo} no podrá iniciar sesión y perderá acceso a todos los datos de inmediato.`,
      confirmarTexto: activar ? 'Reactivar' : 'Desactivar',
      peligro: !activar,
    })
    if (!ok) return
    const r = await actualizar(u.id, { activo: activar })
    if (!r.ok) return toast.error(r.error)
    toast.success(activar ? 'Cuenta reactivada' : 'Cuenta desactivada')
    if (u.rol === 'mecanico') recargarCatalogos()
  }

  return (
    <>
      <PageHeader
        titulo="Usuarios y permisos"
        subtitulo={`${usuarios.filter((u) => u.activo).length} cuenta(s) activa(s)`}
        acciones={
          <Button variant="primary" to="/admin/usuarios/nuevo">
            Crear nuevo usuario
          </Button>
        }
      />
      <Card className="filters">
        <div className="filters__row">
          <FormField label="Buscar" htmlFor="buscar-u" className="grow">
            <SearchInput id="buscar-u" placeholder="Nombre o correo" onSearch={setTexto} />
          </FormField>
          <FormField label="Rol" htmlFor="f-rol">
            <Select id="f-rol" value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Todos" options={ROLES_STAFF.map((r) => ({ value: r, label: ETIQUETA_ROL[r] }))} />
          </FormField>
        </div>
      </Card>
      <Card padding={false}>
        <DataTable
          loading={loading}
          error={error}
          onRetry={refetch}
          rows={filtrados}
          emptyMessage="Sin usuarios"
          onRowClick={(u) => navigate(`/admin/usuarios/${u.id}`)}
          columns={[
            {
              key: 'nombre',
              header: 'Nombre',
              render: (u) => (
                <span>
                  <strong>{u.nombre_completo}</strong> {u.id === user?.id && <Badge>Tú</Badge>}
                </span>
              ),
            },
            { key: 'correo', header: 'Correo' },
            { key: 'telefono', header: 'Teléfono', render: (u) => u.telefono ?? '—' },
            { key: 'rol', header: 'Rol', render: (u) => <Badge tono={TONO_ROL[u.rol]}>{ETIQUETA_ROL[u.rol]}</Badge> },
            { key: 'activo', header: 'Estado', render: (u) => <ActivoToggle activo={u.activo} /> },
            { key: 'alta', header: 'Alta', render: (u) => formatFecha(u.created_at) },
            {
              key: 'acc',
              header: '',
              align: 'right',
              render: (u) => (
                <span className="row-wrap" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" to={`/admin/usuarios/${u.id}`}>
                    Editar
                  </Button>
                  {u.id !== user?.id && (
                    <Button size="sm" variant={u.activo ? 'danger' : 'secondary'} disabled={pending} onClick={() => alternar(u)}>
                      {u.activo ? 'Desactivar' : 'Reactivar'}
                    </Button>
                  )}
                </span>
              ),
            },
          ]}
        />
      </Card>
      <ConfirmDialog {...dialogProps} />
    </>
  )
}
