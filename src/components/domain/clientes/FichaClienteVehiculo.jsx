import { Link } from 'react-router-dom'
import { formatearRut } from '@/lib/rut'

// Resumen compacto vehículo + dueño (registro, nueva orden, notificación)
export default function FichaClienteVehiculo({ vehiculo, cliente, base, acciones }) {
  const c = cliente ?? vehiculo?.clientes
  return (
    <div className="ficha">
      <div className="ficha__patente" aria-label={`Patente ${vehiculo?.patente}`}>
        {vehiculo?.patente}
      </div>
      <div className="ficha__body">
        <div className="ficha__titulo">
          {vehiculo?.marca} {vehiculo?.modelo} {vehiculo?.anio}
          {vehiculo?.color ? ` · ${vehiculo.color}` : ''}
        </div>
        {c && (
          <div className="muted small">
            {base ? <Link to={`${base}/clientes/${c.id}`}>{c.nombre}</Link> : c.nombre} · {formatearRut(c.rut)} ·{' '}
            <a href={`tel:${c.telefono}`}>{c.telefono}</a>
            {c.correo ? ` · ${c.correo}` : ''}
          </div>
        )}
      </div>
      {acciones && <div className="ficha__acciones">{acciones}</div>}
    </div>
  )
}
