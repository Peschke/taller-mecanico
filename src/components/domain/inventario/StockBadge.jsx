import Badge from '@/components/ui/Badge'

export default function StockBadge({ stock, minimo = 0 }) {
  const s = Number(stock)
  const tono = s === 0 ? 'danger' : s <= Number(minimo) ? 'warning' : 'success'
  const texto = s === 0 ? 'Sin stock' : `${s} u.`
  return <Badge tono={tono}>{texto}</Badge>
}
