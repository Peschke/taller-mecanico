import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import RutInput from './RutInput'

/**
 * RF01. Formulario controlado: value = { rut, nombre, telefono, correo }.
 * rutBloqueado: el RUT de un cliente existente no se edita.
 */
export default function ClienteForm({ value, onChange, errores = {}, rutBloqueado = false, rutAyuda, idPrefix = 'cli', autoFocusRut = false }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v?.target ? v.target.value : v })
  return (
    <div className="form-grid">
      <FormField label="RUT" htmlFor={`${idPrefix}-rut`} required error={errores.rut} hint={rutAyuda}>
        <RutInput id={`${idPrefix}-rut`} value={value.rut} onChange={set('rut')} disabled={rutBloqueado} invalid={!!errores.rut} autoFocus={autoFocusRut} />
      </FormField>
      <FormField label="Nombre completo" htmlFor={`${idPrefix}-nombre`} required error={errores.nombre} className="span-2">
        <Input id={`${idPrefix}-nombre`} value={value.nombre} onChange={set('nombre')} autoComplete="off" invalid={!!errores.nombre} />
      </FormField>
      <FormField label="Teléfono" htmlFor={`${idPrefix}-tel`} required error={errores.telefono}>
        <Input id={`${idPrefix}-tel`} type="tel" inputMode="tel" placeholder="+56 9 1234 5678" value={value.telefono} onChange={set('telefono')} invalid={!!errores.telefono} />
      </FormField>
      <FormField label="Correo" htmlFor={`${idPrefix}-correo`} error={errores.correo} hint="Para avisarle por correo cuando el auto esté listo.">
        <Input id={`${idPrefix}-correo`} type="email" inputMode="email" placeholder="nombre@correo.cl" value={value.correo} onChange={set('correo')} invalid={!!errores.correo} />
      </FormField>
    </div>
  )
}
