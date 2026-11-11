import Card from '@/components/ui/Card'
import { formatearRut } from '@/lib/rut'
import { formatFechaHora, formatKm } from '@/lib/format'
import { labelDe, NIVELES_COMBUSTIBLE } from '@/lib/constants/enums'

export default function OrdenResumen({ orden, acciones }) {
  const v = orden.vehiculos
  const c = orden.clientes
  return (
    <div className="grid-3">
      <Card titulo="Vehículo">
        <dl className="dl">
          <dt>Patente</dt>
          <dd>{v?.patente}</dd>
          <dt>Vehículo</dt>
          <dd>
            {v?.marca} {v?.modelo} {v?.anio}
          </dd>
          {v?.color && (
            <>
              <dt>Color</dt>
              <dd>{v.color}</dd>
            </>
          )}
        </dl>
      </Card>
      <Card titulo="Cliente">
        <dl className="dl">
          <dt>Nombre</dt>
          <dd>{c?.nombre}</dd>
          <dt>RUT</dt>
          <dd>{formatearRut(c?.rut)}</dd>
          <dt>Teléfono</dt>
          <dd>
            <a href={`tel:${c?.telefono}`}>{c?.telefono}</a>
          </dd>
          {c?.correo && (
            <>
              <dt>Correo</dt>
              <dd>{c.correo}</dd>
            </>
          )}
        </dl>
      </Card>
      <Card titulo="Ingreso" acciones={acciones}>
        <dl className="dl">
          <dt>Fecha</dt>
          <dd>{formatFechaHora(orden.fecha_ingreso)}</dd>
          <dt>Kilometraje</dt>
          <dd>{formatKm(orden.kilometraje)}</dd>
          <dt>Combustible</dt>
          <dd>{labelDe(NIVELES_COMBUSTIBLE, orden.nivel_combustible)}</dd>
          <dt>Recepción</dt>
          <dd>{orden.recepcionista?.nombre_completo ?? '—'}</dd>
          <dt>Mecánico</dt>
          <dd>{orden.mecanico?.nombre_completo ?? 'Sin asignar'}</dd>
        </dl>
        <p className="small">
          <strong>Motivo:</strong> {orden.motivo_ingreso}
        </p>
      </Card>
    </div>
  )
}
