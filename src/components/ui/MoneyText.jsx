import { formatCLP } from '@/lib/format'

export default function MoneyText({ value, className, strong = false }) {
  const Tag = strong ? 'strong' : 'span'
  return <Tag className={['money-text', className].filter(Boolean).join(' ')}>{formatCLP(value)}</Tag>
}
