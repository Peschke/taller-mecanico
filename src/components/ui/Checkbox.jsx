export default function Checkbox({ label, id, className, ...rest }) {
  return (
    <label className={['checkbox', className].filter(Boolean).join(' ')} htmlFor={id}>
      <input type="checkbox" id={id} {...rest} />
      <span>{label}</span>
    </label>
  )
}
