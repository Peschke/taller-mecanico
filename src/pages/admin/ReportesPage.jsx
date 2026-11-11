import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import KpiCard from '@/components/ui/KpiCard'
import MonthRangePicker from '@/components/ui/MonthRangePicker'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Skeleton from '@/components/ui/Skeleton'
import ReporteChart from '@/components/domain/reportes/ReporteChart'
import ReporteTable from '@/components/domain/reportes/ReporteTable'
import ExportButtons from '@/components/domain/reportes/ExportButtons'
import { useReporte } from '@/hooks/finanzas/useReporte'
import { MENSAJES } from '@/lib/constants/mensajes'
import { formatCLP, formatMes, formatNumero } from '@/lib/format'
import { mesActual, mesCorto, sumarMeses } from '@/lib/fechas'

const TIPOS = [
  { value: 'financiero', label: 'Financiero' },
  { value: 'flujo', label: 'Flujo de vehículos' },
  { value: 'consumo', label: 'Consumo de repuestos' },
  { value: 'rendimiento', label: 'Rendimiento del equipo' },
]

const suma = (rows, k) => rows.reduce((s, r) => s + Number(r[k] ?? 0), 0)
const clpCorto = (n) => (Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : Math.abs(n) >= 1e3 ? `$${Math.round(n / 1e3)}k` : `$${n}`)

const DEFS = {
  financiero: {
    rowKey: 'mes',
    kpis: (r) => [
      { label: 'Facturado', value: formatCLP(suma(r, 'facturado')), detalle: `${suma(r, 'ordenes_cerradas')} órdenes cerradas` },
      { label: 'Ingresos de caja', value: formatCLP(suma(r, 'ingresos_caja')), detalle: `${suma(r, 'abonos')} abonos` },
      { label: 'Egresos en compras', value: formatCLP(suma(r, 'egresos_compras')) },
      { label: 'Margen bruto', value: formatCLP(suma(r, 'margen_bruto')), detalle: `Neto de caja: ${formatCLP(suma(r, 'ingresos_caja') - suma(r, 'egresos_compras'))}` },
    ],
    chart: { series: [{ key: 'facturado', label: 'Facturado' }, { key: 'egresos_compras', label: 'Compras' }, { key: 'margen_bruto', label: 'Margen bruto' }], format: clpCorto },
    columns: [
      { key: 'mes', header: 'Mes', render: (r) => formatMes(r.mes), value: (r) => formatMes(r.mes) },
      { key: 'ordenes_cerradas', header: 'Órdenes', align: 'right', total: (rs) => suma(rs, 'ordenes_cerradas') },
      { key: 'facturado', header: 'Facturado', align: 'right', render: (r) => formatCLP(r.facturado), total: (rs) => formatCLP(suma(rs, 'facturado')) },
      { key: 'mano_obra', header: 'Mano de obra', align: 'right', render: (r) => formatCLP(r.mano_obra), total: (rs) => formatCLP(suma(rs, 'mano_obra')) },
      { key: 'venta_repuestos', header: 'Venta repuestos', align: 'right', render: (r) => formatCLP(r.venta_repuestos), total: (rs) => formatCLP(suma(rs, 'venta_repuestos')) },
      { key: 'costo_repuestos', header: 'Costo repuestos', align: 'right', render: (r) => formatCLP(r.costo_repuestos), total: (rs) => formatCLP(suma(rs, 'costo_repuestos')) },
      { key: 'margen_bruto', header: 'Margen bruto', align: 'right', render: (r) => formatCLP(r.margen_bruto), total: (rs) => formatCLP(suma(rs, 'margen_bruto')) },
      { key: 'ingresos_caja', header: 'Caja', align: 'right', render: (r) => formatCLP(r.ingresos_caja), total: (rs) => formatCLP(suma(rs, 'ingresos_caja')) },
      { key: 'egresos_compras', header: 'Compras', align: 'right', render: (r) => formatCLP(r.egresos_compras), total: (rs) => formatCLP(suma(rs, 'egresos_compras')) },
    ],
  },
  flujo: {
    rowKey: 'mes',
    kpis: (r) => {
      const conDias = r.filter((x) => x.dias_promedio_estadia != null)
      return [
        { label: 'Ingresados', value: formatNumero(suma(r, 'ingresados')) },
        { label: 'Entregados', value: formatNumero(suma(r, 'entregados')) },
        { label: 'Cancelados', value: formatNumero(suma(r, 'cancelados')) },
        { label: 'Días promedio en taller', value: conDias.length ? (suma(conDias, 'dias_promedio_estadia') / conDias.length).toFixed(1) : '—' },
      ]
    },
    chart: { series: [{ key: 'ingresados', label: 'Ingresados' }, { key: 'entregados', label: 'Entregados' }], format: (n) => Math.round(n) },
    columns: [
      { key: 'mes', header: 'Mes', render: (r) => formatMes(r.mes), value: (r) => formatMes(r.mes) },
      { key: 'ingresados', header: 'Ingresados', align: 'right', total: (rs) => suma(rs, 'ingresados') },
      { key: 'entregados', header: 'Entregados', align: 'right', total: (rs) => suma(rs, 'entregados') },
      { key: 'cancelados', header: 'Cancelados', align: 'right', total: (rs) => suma(rs, 'cancelados') },
      { key: 'en_taller', header: 'Aún en taller', align: 'right', total: (rs) => suma(rs, 'en_taller') },
      { key: 'dias_promedio_estadia', header: 'Días prom.', align: 'right', render: (r) => r.dias_promedio_estadia ?? '—' },
    ],
  },
  consumo: {
    rowKey: '_k',
    kpis: (r) => [
      { label: 'Unidades consumidas', value: formatNumero(suma(r, 'unidades')) },
      { label: 'Costo de repuestos', value: formatCLP(suma(r, 'costo_total')) },
      { label: 'Repuestos distintos', value: formatNumero(new Set(r.map((x) => x.codigo)).size) },
    ],
    chart: null,
    columns: [
      { key: 'mes', header: 'Mes', render: (r) => formatMes(r.mes), value: (r) => formatMes(r.mes) },
      { key: 'codigo', header: 'Código' },
      { key: 'nombre', header: 'Repuesto' },
      { key: 'categoria', header: 'Categoría', render: (r) => r.categoria ?? '—' },
      { key: 'unidades', header: 'Unidades', align: 'right', total: (rs) => suma(rs, 'unidades') },
      { key: 'costo_total', header: 'Costo', align: 'right', render: (r) => formatCLP(r.costo_total), total: (rs) => formatCLP(suma(rs, 'costo_total')) },
    ],
  },
  rendimiento: {
    rowKey: 'mecanico_id',
    kpis: (r) => [
      { label: 'Mecánicos', value: r.length },
      { label: 'Órdenes terminadas', value: formatNumero(suma(r, 'ordenes_terminadas')) },
      { label: 'Mano de obra generada', value: formatCLP(suma(r, 'mano_obra_generada')) },
    ],
    chart: { series: [{ key: 'ordenes_asignadas', label: 'Asignadas' }, { key: 'ordenes_terminadas', label: 'Terminadas' }], format: (n) => Math.round(n), labelKey: 'nombre_completo' },
    columns: [
      { key: 'nombre_completo', header: 'Mecánico' },
      { key: 'ordenes_asignadas', header: 'Asignadas', align: 'right', total: (rs) => suma(rs, 'ordenes_asignadas') },
      { key: 'ordenes_terminadas', header: 'Terminadas', align: 'right', total: (rs) => suma(rs, 'ordenes_terminadas') },
      { key: 'horas_promedio_hasta_termino', header: 'Horas prom. hasta terminar', align: 'right', render: (r) => r.horas_promedio_hasta_termino ?? '—' },
      { key: 'mano_obra_generada', header: 'Mano de obra', align: 'right', render: (r) => formatCLP(r.mano_obra_generada), total: (rs) => formatCLP(suma(rs, 'mano_obra_generada')) },
    ],
  },
}

// CU-12 · RF31
export default function ReportesPage() {
  const [params, setParams] = useSearchParams()
  const tipo = DEFS[params.get('tipo')] ? params.get('tipo') : 'financiero'
  const [rango, setRango] = useState({ desde: sumarMeses(mesActual(), -5), hasta: mesActual() })
  const { filas, loading, error, refetch } = useReporte(tipo, rango.desde, rango.hasta)
  const def = DEFS[tipo]
  const rows = tipo === 'consumo' ? filas.map((f, i) => ({ ...f, _k: `${f.mes}-${f.codigo}-${i}` })) : filas
  const etiqueta = TIPOS.find((t) => t.value === tipo).label
  const nombreArchivo = `reporte-${tipo}-${rango.desde}_a_${rango.hasta}`

  return (
    <>
      <PageHeader
        titulo="Reportes y estadísticas"
        subtitulo={tipo === 'rendimiento' ? 'Acumulado histórico' : `${formatMes(`${rango.desde}-01`)} a ${formatMes(`${rango.hasta}-01`)}`}
        acciones={<ExportButtons nombre={nombreArchivo} rows={rows} csvColumns={def.columns.map((c) => ({ key: c.key, header: c.header, value: c.value }))} />}
      />
      <Tabs value={tipo} onChange={(v) => setParams({ tipo: v }, { replace: true })} tabs={TIPOS} />
      {tipo !== 'rendimiento' && (
        <Card className="filters no-print">
          <MonthRangePicker desde={rango.desde} hasta={rango.hasta} onChange={(r) => r.desde && r.hasta && setRango(r)} />
        </Card>
      )}
      <h2 className="print-only">
        {etiqueta} · {rango.desde} a {rango.hasta}
      </h2>

      {error ? (
        <ErrorState mensaje={error} onRetry={refetch} />
      ) : !loading && !rows.length ? (
        <Card>
          <EmptyState mensaje={MENSAJES.SIN_DATOS_PERIODO} />
        </Card>
      ) : (
        <div className="stack">
          <div className="grid-kpi">
            {def.kpis(rows).map((k) => (
              <KpiCard key={k.label} loading={loading} {...k} />
            ))}
          </div>
          {def.chart && (
            <Card titulo={etiqueta}>
              {loading ? (
                <Skeleton height={240} />
              ) : (
                <ReporteChart
                  titulo={etiqueta}
                  data={rows.map((r) => ({ ...r, label: def.chart.labelKey ? r[def.chart.labelKey] : mesCorto(r.mes) }))}
                  series={def.chart.series}
                  format={def.chart.format}
                />
              )}
            </Card>
          )}
          <Card titulo="Detalle" padding={false}>
            <ReporteTable columns={def.columns} rows={rows} rowKey={def.rowKey} loading={loading} emptyMessage={MENSAJES.SIN_DATOS_PERIODO} />
          </Card>
        </div>
      )}
    </>
  )
}
