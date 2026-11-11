import { formatFechaHora, formatKm } from '@/lib/format'
import { labelDe, NIVELES_COMBUSTIBLE } from '@/lib/constants/enums'

// Comprobante de ingreso para entregar al cliente (RF07): código de la orden y código de seguimiento
export default function OrdenTicket({ orden, vehiculo, cliente, ingreso }) {
  return (
    <div className="ticket">
      <div className="ticket__head">
        <div>
          <div className="lbl-sec">Orden de trabajo</div>
          <div className="ticket__codigo">{orden.codigo}</div>
        </div>
        <div className="ticket__seg">
          <div className="lbl-sec">Código de seguimiento</div>
          <div className="ticket__codigo ticket__codigo--seg">{orden.codigo_seguimiento}</div>
        </div>
      </div>
      <dl className="dl">
        <dt>Fecha de ingreso</dt>
        <dd>{formatFechaHora(orden.fecha_ingreso)}</dd>
        <dt>Vehículo</dt>
        <dd>
          {vehiculo?.patente} · {vehiculo?.marca} {vehiculo?.modelo} {vehiculo?.anio}
        </dd>
        <dt>Cliente</dt>
        <dd>{cliente?.nombre}</dd>
        <dt>Kilometraje</dt>
        <dd>{formatKm(ingreso?.kilometraje)}</dd>
        <dt>Combustible</dt>
        <dd>{labelDe(NIVELES_COMBUSTIBLE, ingreso?.nivel_combustible)}</dd>
        <dt>Motivo</dt>
        <dd>{ingreso?.motivo_ingreso}</dd>
      </dl>
      <p className="small">
        Consulta el estado de tu vehículo en <strong>{window.location.origin}/seguimiento</strong> con la patente y el código de seguimiento.
      </p>
    </div>
  )
}
