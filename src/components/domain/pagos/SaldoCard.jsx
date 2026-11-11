import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { formatCLP } from '@/lib/format'

export default function SaldoCard({ saldo, loading }) {
  return (
    <Card titulo="Saldo">
      {loading && !saldo ? (
        <Skeleton height={60} />
      ) : (
        <dl className="totales">
          <dt>Total aprobado</dt>
          <dd>{formatCLP(saldo?.total_aprobado ?? 0)}</dd>
          <dt>Pagado</dt>
          <dd>{formatCLP(saldo?.pagado ?? 0)}</dd>
          <dt className="totales__total">Saldo pendiente</dt>
          <dd className={['totales__total', Number(saldo?.saldo) > 0 ? 'text-danger' : 'text-success'].join(' ')}>
            {formatCLP(saldo?.saldo ?? 0)}
          </dd>
        </dl>
      )}
    </Card>
  )
}
