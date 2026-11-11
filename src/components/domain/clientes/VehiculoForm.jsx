import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import PatenteInput from './PatenteInput'

/**
 * RF02. Formulario controlado: value = { patente, marca, modelo, anio, color, vin }.
 * conPatente = false cuando la patente ya se ingresó arriba (no se edita).
 */
export default function VehiculoForm({ value, onChange, errores = {}, conPatente = false, idPrefix = 'veh' }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v?.target ? v.target.value : v })
  return (
    <div className="form-grid">
      {conPatente && (
        <FormField label="Patente" htmlFor={`${idPrefix}-patente`} required error={errores.patente}>
          <PatenteInput id={`${idPrefix}-patente`} value={value.patente} onChange={set('patente')} invalid={!!errores.patente} />
        </FormField>
      )}
      <FormField label="Marca" htmlFor={`${idPrefix}-marca`} required error={errores.marca}>
        <Input id={`${idPrefix}-marca`} value={value.marca} onChange={set('marca')} placeholder="Toyota" invalid={!!errores.marca} />
      </FormField>
      <FormField label="Modelo" htmlFor={`${idPrefix}-modelo`} required error={errores.modelo}>
        <Input id={`${idPrefix}-modelo`} value={value.modelo} onChange={set('modelo')} placeholder="Yaris" invalid={!!errores.modelo} />
      </FormField>
      <FormField label="Año" htmlFor={`${idPrefix}-anio`} required error={errores.anio}>
        <Input
          id={`${idPrefix}-anio`}
          inputMode="numeric"
          maxLength={4}
          value={value.anio}
          onChange={(e) => set('anio')(e.target.value.replace(/\D/g, ''))}
          placeholder="2018"
          invalid={!!errores.anio}
        />
      </FormField>
      <FormField label="Color" htmlFor={`${idPrefix}-color`}>
        <Input id={`${idPrefix}-color`} value={value.color} onChange={set('color')} placeholder="Gris" />
      </FormField>
      <FormField label="VIN (opcional)" htmlFor={`${idPrefix}-vin`} error={errores.vin} hint="17 caracteres, en el parabrisas o la puerta.">
        <Input
          id={`${idPrefix}-vin`}
          value={value.vin}
          maxLength={17}
          onChange={(e) => set('vin')(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
          invalid={!!errores.vin}
          className="input--mono"
        />
      </FormField>
    </div>
  )
}
