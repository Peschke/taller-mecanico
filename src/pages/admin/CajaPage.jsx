import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import ResumenCaja from '@/components/domain/pagos/ResumenCaja'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { pagosService } from '@/services/pagosService'
import { ordenesService } from '@/services/ordenesService'
import { formatCLP, formatFecha, formatFechaHora } from '@/lib/format'
import { hoyISO, limitesDia } from '@/lib/fechas'
import { labelDe, METODOS_PAGO } from '@/lib/constants/enums'
import { imprimirPDF } from '@/lib/exportar'

// CU-11: lo que falta cobrar y el resumen de caja del día
export default function CajaPage() {
  const [dia, setDia] = useState(hoyISO())

  const porCobrar = useSupabaseQuery(
    async () => {
      const { data: saldos, error } = await pagosService.porCobrar()
      if (error) throw error
      if (!saldos.length) return []
      const { data: panel, error: e2 } = await ordenesService.listarPanelPorIds(saldos.map((s) => s.orden_id))
      if (e2) throw e2
      const info = Object.fromEntries(panel.map((o) => [o.id, o]))
      return saldos
        .map((s) => ({ ...s, id: s.orden_id, ...info[s.orden_id], estado: s.estado }))
        .sort((a, b) => Number(b.estado === 'listo_entrega') - Number(a.estado === 'listo_entrega'))
    },
    [],
    { initialData: [] },
  )

  const { desde, hasta } = limitesDia(dia)
  const pagosDia = useSupabaseQuery(() => pagosService.listarEntre(desde, hasta), [dia], { initialData: [] })

  return (
    <>
      <PageHeader titulo="Caja" subtitulo="Órdenes por cobrar y resumen del día" />

      <Card titulo="Por cobrar" padding={false} className="section">
        <DataTable
          loading={porCobrar.loading}
          error={porCobrar.error}
          onRetry={porCobrar.refetch}
          rows={porCobrar.data}
          emptyMessage="No hay órdenes con saldo pendiente"
          columns={[
            { key: 'codigo', header: 'Orden', render: (o) => <code className="code">{o.codigo}</code> },
            { key: 'patente', header: 'Patente', render: (o) => <strong>{o.patente}</strong> },
            { key: 'cliente', header: 'Cliente' },
            { key: 'estado', header: 'Estado', render: (o) => <EstadoBadge estado={o.estado} /> },
            { key: 'total', header: 'Total aprobado', align: 'right', render: (o) => formatCLP(o.total_aprobado) },
            { key: 'pagado', header: 'Pagado', align: 'right', render: (o) => formatCLP(o.pagado) },
            { key: 'saldo', header: 'Saldo', align: 'right', render: (o) => <strong>{formatCLP(o.saldo)}</strong> },
            {
              key: 'acc',
              header: '',
              align: 'right',
              render: (o) => (
                <Button size="sm" variant={o.estado === 'listo_entrega' ? 'primary' : 'secondary'} to={`/admin/ordenes/${o.orden_id}/cobro`}>
                  Cobrar
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card
        titulo={`Resumen de caja · ${formatFecha(desde)}`}
        acciones={
          <div className="row-wrap no-print">
            <FormField label="Día" htmlFor="dia-caja">
              <Input id="dia-caja" type="date" value={dia} max={hoyISO()} onChange={(e) => e.target.value && setDia(e.target.value)} />
            </FormField>
            <Button size="sm" onClick={() => imprimirPDF(`Caja ${dia}`)} disabled={!pagosDia.data?.length}>
              Imprimir resumen
            </Button>
          </div>
        }
      >
        <ResumenCaja pagos={pagosDia.data ?? []} />
        <div className="section-sm">
          <DataTable
            loading={pagosDia.loading}
            error={pagosDia.error}
            onRetry={pagosDia.refetch}
            rows={pagosDia.data}
            emptyMessage="Sin pagos en este día"
            columns={[
              { key: 'hora', header: 'Hora', render: (p) => formatFechaHora(p.created_at).split(' ').pop() },
              { key: 'orden', header: 'Orden', render: (p) => `${p.ordenes_trabajo?.codigo ?? ''} · ${p.ordenes_trabajo?.vehiculos?.patente ?? ''}` },
              { key: 'metodo', header: 'Método', render: (p) => labelDe(METODOS_PAGO, p.metodo) },
              { key: 'op', header: 'N° operación', render: (p) => p.numero_operacion ?? '—' },
              {
                key: 'tipo',
                header: 'Tipo',
                render: (p) => (p.anulado ? <Badge tono="danger">Anulado</Badge> : p.es_abono ? <Badge tono="warning">Abono</Badge> : <Badge tono="success">Pago</Badge>),
              },
              { key: 'monto', header: 'Monto', align: 'right', render: (p) => <span className={p.anulado ? 'tachado' : undefined}>{formatCLP(p.monto)}</span> },
              { key: 'usuario', header: 'Registró', render: (p) => p.perfiles?.nombre_completo ?? '—' },
            ]}
          />
        </div>
      </Card>
    </>
  )
}
