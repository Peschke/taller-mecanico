import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import { NIVELES_COMBUSTIBLE } from '@/lib/constants/enums'
import { formatKm } from '@/lib/format'

const fmt = new Intl.NumberFormat('es-CL')

/**
 * RF05: kilometraje, nivel de combustible, motivo y observaciones.
 * value = { kilometraje, nivel_combustible, motivo_ingreso, observaciones_ingreso }
 */
export default function OrdenIngresoForm({ value, onChange, errores = {}, ultimoKm, idPrefix = 'ot' }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v?.target ? v.target.value : v })
  const km = Number(String(value.kilometraje ?? '').replace(/\D/g, ''))
  const bajaKm = ultimoKm != null && value.kilometraje !== '' && km < Number(ultimoKm)

  return (
    <div className="stack">
      <div className="form-grid">
        <FormField
          label="Kilometraje"
          htmlFor={`${idPrefix}-km`}
          required
          error={errores.kilometraje}
          hint={bajaKm ? `Ojo: es menor al último registrado (${formatKm(ultimoKm)}).` : ultimoKm != null ? `Última visita: ${formatKm(ultimoKm)}` : undefined}
        >
          <Input
            id={`${idPrefix}-km`}
            inputMode="numeric"
            value={value.kilometraje === '' ? '' : fmt.format(km)}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, '')
              set('kilometraje')(d === '' ? '' : String(Number(d)))
            }}
            invalid={!!errores.kilometraje}
          />
        </FormField>
        <fieldset className="field fieldset">
          <legend className="field__label">
            Nivel de combustible <span className="field__req" aria-hidden="true">*</span>
          </legend>
          <div className="segmented" role="radiogroup" aria-label="Nivel de combustible">
            {NIVELES_COMBUSTIBLE.map((n) => (
              <label key={n.value} className={['segmented__opt', value.nivel_combustible === n.value && 'segmented__opt--on'].filter(Boolean).join(' ')}>
                <input type="radio" name={`${idPrefix}-comb`} value={n.value} checked={value.nivel_combustible === n.value} onChange={() => set('nivel_combustible')(n.value)} />
                {n.label}
              </label>
            ))}
          </div>
          {errores.nivel_combustible && (
            <p className="field__error" role="alert">
              {errores.nivel_combustible}
            </p>
          )}
        </fieldset>
      </div>
      <FormField label="Motivo de ingreso (problema reportado por el cliente)" htmlFor={`${idPrefix}-motivo`} required error={errores.motivo_ingreso}>
        <TextArea id={`${idPrefix}-motivo`} rows={3} value={value.motivo_ingreso} onChange={set('motivo_ingreso')} invalid={!!errores.motivo_ingreso} placeholder="Ej: ruido al frenar, testigo de motor encendido…" />
      </FormField>
      <FormField label="Observaciones de la inspección inicial" htmlFor={`${idPrefix}-obs`} hint="Rayones, abolladuras, objetos en el auto, accesorios…">
        <TextArea id={`${idPrefix}-obs`} rows={3} value={value.observaciones_ingreso} onChange={set('observaciones_ingreso')} />
      </FormField>
    </div>
  )
}
