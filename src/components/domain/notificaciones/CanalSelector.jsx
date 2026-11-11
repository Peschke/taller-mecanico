const CANALES = [
  { value: 'email', label: 'Correo', detalle: 'Envío automático' },
  { value: 'whatsapp', label: 'WhatsApp', detalle: 'Abre el chat con el mensaje' },
  { value: 'llamada', label: 'Llamada', detalle: 'Registrar que se llamó' },
]

export default function CanalSelector({ value, onChange, deshabilitados = {} }) {
  return (
    <div className="canales" role="radiogroup" aria-label="Canal de aviso">
      {CANALES.map((c) => (
        <label key={c.value} className={['canal', value === c.value && 'canal--activo', deshabilitados[c.value] && 'canal--off'].filter(Boolean).join(' ')}>
          <input type="radio" name="canal" value={c.value} checked={value === c.value} disabled={Boolean(deshabilitados[c.value])} onChange={() => onChange(c.value)} />
          <span className="canal__label">{c.label}</span>
          <span className="canal__detalle">{deshabilitados[c.value] || c.detalle}</span>
        </label>
      ))}
    </div>
  )
}
