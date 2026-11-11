import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import FormField from '@/components/ui/FormField'
import PatenteInput from '@/components/domain/clientes/PatenteInput'
import ClienteForm from '@/components/domain/clientes/ClienteForm'
import VehiculoForm from '@/components/domain/clientes/VehiculoForm'
import FichaClienteVehiculo from '@/components/domain/clientes/FichaClienteVehiculo'
import { useVehiculoPorPatente, useGuardarVehiculo } from '@/hooks/clientes/useVehiculos'
import { useClientePorRut, useGuardarCliente } from '@/hooks/clientes/useClientes'
import { useBasePath } from '@/hooks/core/useBasePath'
import { useAuth } from '@/hooks/core/useAuth'
import { useToast } from '@/hooks/core/useToast'
import { clientesService } from '@/services/clientesService'
import { vehiculosService } from '@/services/vehiculosService'
import { formatearRut } from '@/lib/rut'
import { sinErrores, validarCliente, validarVehiculo } from '@/lib/validaciones'
import { rutaOrden } from '@/routes/paths'

const CLIENTE_VACIO = { rut: '', nombre: '', telefono: '', correo: '' }
const VEHICULO_VACIO = { patente: '', marca: '', modelo: '', anio: '', color: '', vin: '' }

const clienteAForm = (c) => ({ rut: formatearRut(c.rut), nombre: c.nombre, telefono: c.telefono, correo: c.correo ?? '' })
const vehiculoAForm = (v) => ({ patente: v.patente, marca: v.marca, modelo: v.modelo, anio: String(v.anio), color: v.color ?? '', vin: v.vin ?? '' })
const cambioContacto = (orig, f) => orig.nombre !== f.nombre.trim() || orig.telefono !== f.telefono.trim() || (orig.correo ?? '') !== f.correo.trim().toLowerCase()
const cambioVehiculo = (orig, f) =>
  orig.marca !== f.marca.trim() || orig.modelo !== f.modelo.trim() || String(orig.anio) !== String(f.anio) || (orig.color ?? '') !== f.color.trim() || (orig.vin ?? '') !== f.vin.trim()

// CU-01 · RF01, RF02, RF03
export default function RegistrarClienteVehiculoPage() {
  const [params] = useSearchParams()
  const base = useBasePath()
  const { rol } = useAuth()
  const toast = useToast()
  const patenteRef = useRef(null)

  const [patente, setPatente] = useState(params.get('patente')?.toUpperCase() ?? '')
  const lookup = useVehiculoPorPatente(patente)
  const [cliente, setCliente] = useState(CLIENTE_VACIO)
  const [vehiculo, setVehiculo] = useState(VEHICULO_VACIO)
  const [errores, setErrores] = useState({ cliente: {}, vehiculo: {} })
  const [clienteFijo, setClienteFijo] = useState(null) // cliente elegido desde ?clienteId o detectado por RUT
  const [resultado, setResultado] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const { crear: crearCliente, actualizar: actualizarCliente } = useGuardarCliente()
  const { crear: crearVehiculo, actualizar: actualizarVehiculo } = useGuardarVehiculo()

  const existente = lookup.estado === 'existe'
  const nueva = lookup.estado === 'nueva'
  const rut = useClientePorRut(cliente.rut, { enabled: nueva && !clienteFijo })

  // Patente registrada → cargar cliente y vehículo (CU-01 FA 4.2)
  useEffect(() => {
    if (existente && lookup.vehiculo) {
      setCliente(clienteAForm(lookup.vehiculo.clientes))
      setVehiculo(vehiculoAForm(lookup.vehiculo))
      setErrores({ cliente: {}, vehiculo: {} })
    }
  }, [existente, lookup.vehiculo])

  // Patente nueva → limpiar datos del vehículo (y del cliente si no venía fijado)
  useEffect(() => {
    if (nueva) {
      setVehiculo({ ...VEHICULO_VACIO, patente: lookup.patente })
      if (!clienteFijo) setCliente(CLIENTE_VACIO)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nueva, lookup.patente])

  // "Crear ingreso" desde la ficha de un cliente: ?clienteId=
  useEffect(() => {
    const id = params.get('clienteId')
    if (!id) return
    clientesService.obtener(id).then(({ data }) => {
      if (data) {
        setClienteFijo(data)
        setCliente(clienteAForm(data))
      }
    })
  }, [params])

  // RUT ya registrado al crear → se reutiliza ese cliente
  useEffect(() => {
    if (rut.estado === 'existe' && rut.cliente) {
      setClienteFijo(rut.cliente)
      setCliente(clienteAForm(rut.cliente))
      toast.info(`El RUT pertenece a ${rut.cliente.nombre}: se asociará el vehículo a esta ficha.`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rut.estado, rut.cliente])

  const reiniciar = () => {
    setPatente('')
    setCliente(CLIENTE_VACIO)
    setVehiculo(VEHICULO_VACIO)
    setClienteFijo(null)
    setResultado(null)
    setErrores({ cliente: {}, vehiculo: {} })
    setTimeout(() => patenteRef.current?.focus(), 0)
  }

  const guardar = async (e) => {
    e.preventDefault()
    const ec = validarCliente(cliente, { conRut: !(existente || clienteFijo) })
    const ev = validarVehiculo({ ...vehiculo, patente: lookup.patente }, { conPatente: nueva })
    setErrores({ cliente: ec, vehiculo: ev })
    if (!sinErrores(ec) || !sinErrores(ev)) return toast.error('Revisa los campos marcados.')

    setGuardando(true)
    try {
      if (existente) {
        // CU-01 FA 4.3: actualizar contacto y datos técnicos
        const v0 = lookup.vehiculo
        let c = v0.clientes
        let v = v0
        if (cambioContacto(c, cliente)) {
          const r = await actualizarCliente(c.id, cliente)
          if (!r.ok) return toast.error(r.error)
          c = r.data
        }
        if (cambioVehiculo(v0, vehiculo)) {
          const r = await actualizarVehiculo(v0.id, vehiculo)
          if (!r.ok) return toast.error(r.error.includes('Ya existe') ? 'Ese VIN ya está registrado en otro vehículo.' : r.error)
          v = r.data
        }
        toast.success('Ficha actualizada')
        setResultado({ vehiculo: { ...v, clientes: c }, cliente: c, ordenAbierta: lookup.ordenAbierta, nuevo: false })
        return
      }

      // Registro nuevo: cliente (existente o nuevo) + vehículo
      let c = clienteFijo
      if (c) {
        if (cambioContacto(c, cliente)) {
          const r = await actualizarCliente(c.id, cliente)
          if (!r.ok) return toast.error(r.error)
          c = r.data
        }
      } else {
        const r = await crearCliente(cliente)
        if (!r.ok) return toast.error(r.error.includes('Ya existe') ? 'Ya existe un cliente con ese RUT.' : r.error)
        c = r.data
        setClienteFijo(c)
      }
      const rv = await crearVehiculo(c.id, { ...vehiculo, patente: lookup.patente })
      if (!rv.ok) {
        if (rv.error.includes('Ya existe')) {
          // Otra persona registró la misma patente o VIN entre medio
          const { data: dup } = await vehiculosService.obtenerPorPatente(lookup.patente)
          if (dup) lookup.refrescar()
          return toast.error(dup ? 'Esa patente acaba de ser registrada. Se cargaron sus datos.' : 'Ese VIN ya está registrado en otro vehículo.')
        }
        return toast.error(rv.error)
      }
      toast.success('Cliente y vehículo registrados')
      setResultado({ vehiculo: rv.data, cliente: c, ordenAbierta: null, nuevo: true })
    } finally {
      setGuardando(false)
    }
  }

  if (resultado) {
    const v = resultado.vehiculo
    return (
      <>
        <PageHeader titulo="Registrar ingreso" />
        <Card className="exito">
          <div className="stack">
            <h2 className="exito__titulo">{resultado.nuevo ? 'Registro exitoso' : 'Ficha actualizada'}</h2>
            <FichaClienteVehiculo vehiculo={v} cliente={resultado.cliente} base={base} />
            {resultado.ordenAbierta && (
              <p className="alerta pad">
                Este vehículo ya tiene la orden <strong>{resultado.ordenAbierta.codigo}</strong> abierta.
              </p>
            )}
            <div className="row-wrap">
              {resultado.ordenAbierta ? (
                <Button variant="primary" size="lg" to={rutaOrden(rol, resultado.ordenAbierta.id)}>
                  Ver orden abierta
                </Button>
              ) : (
                <Button variant="primary" size="lg" to={`${base}/ordenes/nueva/${v.id}`}>
                  Crear orden de trabajo
                </Button>
              )}
              <Button to={`${base}/vehiculos/${v.id}`}>Ver ficha del vehículo</Button>
              <Button variant="ghost" onClick={reiniciar}>
                Registrar otro
              </Button>
            </div>
          </div>
        </Card>
      </>
    )
  }

  const estadoPatente = {
    buscando: (
      <span className="row-wrap muted small">
        <Spinner size="sm" inline /> Verificando patente…
      </span>
    ),
    invalida: <span className="field__error">Patente inválida: 5 a 8 letras y números.</span>,
    existe: <Badge tono="success">Vehículo registrado · datos cargados</Badge>,
    nueva: <Badge tono="info">Patente nueva · completa el registro</Badge>,
    error: <span className="field__error">No se pudo verificar la patente. Revisa tu conexión.</span>,
  }[lookup.estado]

  return (
    <>
      <PageHeader titulo="Registrar ingreso" subtitulo="CU-01 · Registrar cliente y vehículo" />

      <Card className="section">
        <div className="patente-check">
          <FormField label="Patente del vehículo" htmlFor="patente" required className="patente-check__field">
            <PatenteInput id="patente" ref={patenteRef} value={patente} onChange={setPatente} autoFocus />
          </FormField>
          <div className="patente-check__estado" aria-live="polite">
            {estadoPatente}
          </div>
        </div>
        {existente && lookup.ordenAbierta && (
          <p className="alerta pad section-sm">
            Este vehículo tiene la orden <strong>{lookup.ordenAbierta.codigo}</strong> abierta.{' '}
            <Link to={rutaOrden(rol, lookup.ordenAbierta.id)}>Ver orden</Link>
          </p>
        )}
      </Card>

      {(existente || nueva) && (
        <form onSubmit={guardar} noValidate className="stack">
          <Card
            titulo="Cliente"
            acciones={
              clienteFijo && nueva ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setClienteFijo(null)
                    setCliente(CLIENTE_VACIO)
                  }}
                >
                  Usar otro cliente
                </Button>
              ) : null
            }
          >
            {existente && <p className="muted small">Puedes actualizar los datos de contacto. El RUT no se modifica.</p>}
            {nueva && clienteFijo && <p className="muted small">Cliente registrado: el vehículo se asociará a esta ficha.</p>}
            <ClienteForm
              value={cliente}
              onChange={setCliente}
              errores={errores.cliente}
              rutBloqueado={existente || Boolean(clienteFijo)}
              rutAyuda={nueva && !clienteFijo ? (rut.estado === 'buscando' ? 'Buscando RUT…' : rut.estado === 'nuevo' ? 'Cliente nuevo' : undefined) : undefined}
            />
          </Card>

          <Card titulo={`Vehículo · ${lookup.patente}`}>
            <VehiculoForm value={vehiculo} onChange={setVehiculo} errores={errores.vehiculo} />
          </Card>

          <div className="form-actions">
            <Button onClick={reiniciar}>Cancelar</Button>
            <Button type="submit" variant="primary" size="lg" loading={guardando}>
              {existente ? 'Guardar cambios' : 'Guardar ficha'}
            </Button>
          </div>
        </form>
      )}
    </>
  )
}
