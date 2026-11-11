// tono: neutral | info | success | warning | danger
export default function Badge({ tono = 'neutral', children, className }) {
  return <span className={['badge', `badge--${tono}`, className].filter(Boolean).join(' ')}>{children}</span>
}
