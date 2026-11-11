// steps: string[]; current: índice actual; omitidos: índices saltados
export default function Stepper({ steps, current, omitidos = [], vertical = false }) {
  return (
    <ol className={['stepper', vertical && 'stepper--vertical'].filter(Boolean).join(' ')}>
      {steps.map((s, i) => {
        const estado = omitidos.includes(i) ? 'skip' : i < current ? 'done' : i === current ? 'current' : 'todo'
        return (
          <li key={s} className={`stepper__step stepper__step--${estado}`} aria-current={estado === 'current' ? 'step' : undefined}>
            <span className="stepper__dot" aria-hidden="true" />
            <span className="stepper__label">{s}</span>
          </li>
        )
      })}
    </ol>
  )
}
