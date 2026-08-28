import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingCart, Package, TrendingUp, ArrowUpDown, AlertTriangle, Truck, Printer, BarChart2, CalendarClock,
} from 'lucide-react'
import PageTitle from '../components/common/PageTitle'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import {
  useDailySummary, useSalesByProduct, useSalesByProvider,
  useReportsLowStock, useReportsExpiring, useSalesReport, useSupplierRestock,
} from '../hooks/useReports'
import ExpiryBadge from '../components/common/ExpiryBadge'
import { useSuppliers } from '../hooks/useSuppliers'
import ReportFilters   from '../components/reports/ReportFilters'
import DateRangeQuick  from '../components/common/DateRangeQuick'
import SummaryCards    from '../components/reports/SummaryCards'
import SalesByDayChart from '../components/reports/SalesByDayChart'
import TopProductsList from '../components/reports/TopProductsList'
import SalesTable      from '../components/reports/SalesTable'
import HelpDrawer from '../components/common/HelpDrawer'
import SupplierOrderModal from '../components/reports/SupplierOrderModal'
import { localISODate } from '../utils/formatDate'
import { useT, t as tr, dateLocale } from '../i18n'

// ── helpers ───────────────────────────────────────────────────────────────────

function today()        { return localISODate() }
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v)
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

/**
 * Imprime la lista de resurtido de un proveedor en una ventana aparte (lista de
 * "productos a pedir"). Resaltamos los que están en/bajo el mínimo. No tocamos
 * el CSS de la app: armamos un documento HTML limpio y llamamos a print().
 */
function printSupplierRestock(supplierName, from, to, rows) {
  const win = window.open('', '_blank')
  if (!win) return

  const body = rows.map((r) => {
    const suggested = Math.max(r.sold, Math.max(0, r.minStock - r.currentStock))
    const low = r.currentStock < r.minStock
    return `<tr${low ? ' class="low"' : ''}>
      <td>${escapeHtml(r.productName)}</td>
      <td class="mono">${escapeHtml(r.sku ?? '')}</td>
      <td class="c">${r.received}</td>
      <td class="c">${r.sold}</td>
      <td class="c">${r.currentStock}</td>
      <td class="c">${r.minStock}</td>
      <td class="c strong">${suggested > 0 ? `${suggested} ${escapeHtml(r.unit ?? '')}` : '—'}</td>
    </tr>`
  }).join('')

  const generated = new Date().toLocaleString(dateLocale())
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
    <title>${escapeHtml(tr('Resurtido'))} — ${escapeHtml(supplierName)}</title>
    <style>
      * { font-family: Arial, Helvetica, sans-serif; }
      body { margin: 24px; color: #111827; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .meta { font-size: 12px; color: #6b7280; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; letter-spacing: .04em; }
      td.c, th.c { text-align: center; }
      td.mono { font-family: monospace; color: #6b7280; }
      td.strong { font-weight: 700; }
      tr.low td { background: #fef2f2; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>${escapeHtml(tr('Productos a pedir'))} — ${escapeHtml(supplierName)}</h1>
    <p class="meta">${escapeHtml(tr('Periodo {from} a {to}', { from, to }))} · ${escapeHtml(tr('Generado'))}: ${escapeHtml(generated)} · ${escapeHtml(tr('{n} producto(s)', { n: rows.length }))}</p>
    <table>
      <thead><tr>
        <th>${escapeHtml(tr('Producto'))}</th><th>${escapeHtml(tr('Código'))}</th>
        <th class="c">${escapeHtml(tr('Recibido'))}</th><th class="c">${escapeHtml(tr('Vendido'))}</th>
        <th class="c">${escapeHtml(tr('Stock actual'))}</th><th class="c">${escapeHtml(tr('Stock mínimo'))}</th><th class="c">${escapeHtml(tr('Sugerido pedir'))}</th>
      </tr></thead>
      <tbody>${body}</tbody>
    </table>
  </body></html>`)
  win.document.close()
  win.focus()
  win.print()
}
function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

// ── shared sub-components ─────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

const TYPE_CONFIG = {
  PURCHASE_ENTRY: { label: 'Entrada',    cls: 'bg-green-100 text-green-700' },
  SALE:           { label: 'Venta',      cls: 'bg-blue-100  text-blue-700' },
  ADJUSTMENT:     { label: 'Ajuste',     cls: 'bg-amber-100 text-amber-700' },
  RETURN:         { label: 'Devolución', cls: 'bg-purple-100 text-purple-700' },
}

function MovementsTable({ movements }) {
  const t = useT()
  if (!movements?.length)
    return <p className="py-8 text-center text-sm text-gray-400">{t('Sin movimientos en este período')}</p>
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Fecha')}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Producto')}</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Tipo')}</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Cantidad')}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Usuario')}</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => {
            const cfg = TYPE_CONFIG[m.type] ?? { label: m.type, cls: 'bg-gray-100 text-gray-600' }
            return (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{m.productName}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>{t(cfg.label)}</span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-gray-700">{m.quantity}</td>
                <td className="px-4 py-3 text-gray-500">{m.createdByName ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Tab: Análisis de Ventas (Bloque 4) ───────────────────────────────────────

function TabSalesReport({ businessId }) {
  const t = useT()
  const [searchParams] = useSearchParams()
  const [page, setPage]     = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // Read filters from URL (persistent, shareable)
  const from       = searchParams.get('from')       || firstOfMonth()
  const to         = searchParams.get('to')         || today()
  const supplierId = searchParams.get('supplierId') || undefined
  const brandId    = searchParams.get('brandId')    || undefined
  const employeeId = searchParams.get('employeeId') || undefined

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0) }, [from, to, supplierId, brandId, employeeId])

  const params = {
    from, to,
    ...(supplierId && { supplierId }),
    ...(brandId    && { brandId }),
    ...(employeeId && { employeeId }),
    ...(businessId && { businessId }),
    page,
    size: pageSize,
  }

  const { data, isLoading, isError } = useSalesReport(params)

  return (
    <div className="space-y-5">
      <ReportFilters businessId={businessId} />
      <SummaryCards summary={data?.summary} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesByDayChart byDay={data?.byDay} isLoading={isLoading} />
        </div>
        <TopProductsList topProducts={data?.topProducts} isLoading={isLoading} />
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 py-10">
          <p className="text-sm text-red-600">{t('No pudimos cargar el reporte')}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            {t('Reintentar')}
          </button>
        </div>
      ) : (
        <SalesTable
          items={data?.items}
          isLoading={isLoading}
          isError={isError}
          page={page}
          onPageChange={setPage}
          pageSize={pageSize}
          onSizeChange={(s) => { setPageSize(s); setPage(0) }}
        />
      )}
    </div>
  )
}

// ── Tab: Resumen del día ──────────────────────────────────────────────────────

function TabDaily({ businessId }) {
  const t = useT()
  const [date, setDate] = useState(today())
  const params = { date, ...(businessId && { businessId }) }
  const { data, isLoading } = useDailySummary(params)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">{t('Fecha')}</label>
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={ShoppingCart}  label={t('Ventas realizadas')}   value={data?.totalSales    ?? 0}                    iconBg="bg-blue-50"    iconColor="text-blue-500" />
            <StatCard icon={Package}       label={t('Items vendidos')}      value={data?.totalItemsSold ?? 0}                   iconBg="bg-indigo-50"  iconColor="text-indigo-500" />
            <StatCard icon={TrendingUp}    label={t('Ingresos')}            value={formatCurrency(data?.totalRevenue)}          iconBg="bg-emerald-50" iconColor="text-emerald-500" />
            <StatCard icon={ArrowUpDown}   label={t('Movimientos del día')} value={data?.movements?.length ?? 0}                iconBg="bg-amber-50"   iconColor="text-amber-500" />
          </div>
          <MovementsTable movements={data?.movements} />
        </>
      )}
    </div>
  )
}

// ── Tab: Por producto ─────────────────────────────────────────────────────────

function TabByProduct({ businessId }) {
  const t = useT()
  const [range, setRange] = useState({ from: firstOfMonth(), to: today() })
  const [reportParams, setReportParams] = useState(null)
  const { data, isLoading } = useSalesByProduct(reportParams, { enabled: !!reportParams })
  const run = () => setReportParams({ ...range, ...(businessId && { businessId }) })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeQuick from={range.from} to={range.to} onChange={setRange} />
        <button onClick={run} disabled={!range.from || !range.to}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {t('Generar reporte')}
        </button>
      </div>
      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-gray-100" />}
      {data && !isLoading && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">{t('Producto')}</th>
                  <th className="px-4 py-3 font-mono">{t('Código')}</th>
                  <th className="px-4 py-3 text-center">{t('Unidades vendidas')}</th>
                  <th className="px-4 py-3 text-right">{t('Ingresos totales')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                  <tr key={row.productId ?? row.productName} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.productName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.productSku}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{row.totalQuantitySold}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="mb-4 text-sm font-semibold text-gray-700">{t('Ingresos por producto')}</h4>
              <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `S/ ${v}`} />
                  <YAxis type="category" dataKey="productName" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [formatCurrency(v), t('Ingresos')]} />
                  <Bar dataKey="totalRevenue" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Tab: Por proveedor ────────────────────────────────────────────────────────

function TabByProvider({ businessId }) {
  const t = useT()
  const [range, setRange] = useState({ from: firstOfMonth(), to: today() })
  const [reportParams, setReportParams] = useState(null)
  const { data, isLoading } = useSalesByProvider(reportParams, { enabled: !!reportParams })
  const run = () => setReportParams({ ...range, ...(businessId && { businessId }) })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeQuick from={range.from} to={range.to} onChange={setRange} />
        <button onClick={run} disabled={!range.from || !range.to}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {t('Generar reporte')}
        </button>
      </div>
      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-gray-100" />}
      {data && !isLoading && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">{t('Proveedor')}</th>
                  <th className="px-4 py-3 text-center">{t('Productos distintos')}</th>
                  <th className="px-4 py-3 text-center">{t('Unidades vendidas')}</th>
                  <th className="px-4 py-3 text-right">{t('Ingresos totales')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                  <tr key={row.providerName} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.providerName}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{row.productCount}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{row.totalQuantitySold}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="mb-4 text-sm font-semibold text-gray-700">{t('Ingresos por proveedor')}</h4>
              <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `S/ ${v}`} />
                  <YAxis type="category" dataKey="providerName" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [formatCurrency(v), t('Ingresos')]} />
                  <Bar dataKey="totalRevenue" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Tab: Stock bajo ───────────────────────────────────────────────────────────

function TabLowStock({ businessId }) {
  const t = useT()
  const { user } = useAuth()
  const params = { size: 500, ...(businessId && { businessId }) }
  const { data, isLoading } = useReportsLowStock(params)
  const items = data?.content ?? []

  // Pedido al proveedor: el PDF que se le comparte lleva solo SU información
  // (código del proveedor, producto, marca, cantidad) — nunca stock ni precios.
  const [orderSupplier, setOrderSupplier] = useState('')
  const { data: suppliersData } = useSuppliers({ size: 200, ...(businessId && { businessId }) })
  const supplierByName = new Map((suppliersData?.content ?? []).map((s) => [s.name, s]))

  const orderableBySupplier = items.reduce((acc, p) => {
    if (!p.providerName || Number(p.deficit) <= 0) return acc
    ;(acc[p.providerName] ??= []).push(p)
    return acc
  }, {})
  const supplierNames = Object.keys(orderableBySupplier).sort((a, b) => a.localeCompare(b))

  // «Generar PDF» ya no imprime en seco: abre la previsual editable (William
  // quita lo que no va a pedir, sube cantidades o agrega productos sin stock bajo).
  const [orderPreview, setOrderPreview] = useState(null)
  const handlePrintOrder = () => {
    const rows = orderableBySupplier[orderSupplier] ?? []
    if (!rows.length) return
    const s = supplierByName.get(orderSupplier)
    setOrderPreview({
      supplier: { id: s?.id, name: orderSupplier, contact: s?.contact, phone: s?.phone, ruc: s?.ruc },
      items: rows.map((p) => ({
        productId:    p.productId,
        productName:  p.productName,
        providerCode: p.providerCode,
        brand:        p.brand,
        qty:          p.deficit,
        unit:         p.unit,
      })),
    })
  }

  return (
    <div className="space-y-4">
      {orderPreview && (
        <SupplierOrderModal
          supplier={orderPreview.supplier}
          items={orderPreview.items}
          user={user}
          businessId={businessId}
          onClose={() => setOrderPreview(null)}
        />
      )}
      {supplierNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
            <Printer size={15} />
            {t('Pedido al proveedor')}
          </div>
          <select value={orderSupplier} onChange={(e) => setOrderSupplier(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20">
            <option value="">{t('Elegir proveedor...')}</option>
            {supplierNames.map((name) => (
              <option key={name} value={name}>
                {name} — {t('{n} producto(s)', { n: orderableBySupplier[name].length })}
              </option>
            ))}
          </select>
          <button onClick={handlePrintOrder} disabled={!orderSupplier}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50">
            {t('Generar PDF')}
          </button>
          <p className="basis-full text-xs text-blue-700/70 sm:basis-auto">
            {t('Antes de generar el PDF verás una previsual editable: quita productos, cambia cantidades o agrega otros.')}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <AlertTriangle size={36} className="text-gray-200" />
          <p className="text-sm text-gray-400">{t('No hay productos con stock bajo')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{t('Producto')}</th>
                <th className="px-4 py-3">{t('Código')}</th>
                <th className="px-4 py-3">{t('Marca')}</th>
                <th className="px-4 py-3">{t('Proveedor')}</th>
                <th className="px-4 py-3">{t('Cód. Proveedor')}</th>
                <th className="px-4 py-3 text-center">{t('Stock actual')}</th>
                <th className="px-4 py-3 text-center">{t('Stock mínimo')}</th>
                <th className="px-4 py-3 text-center">{t('Déficit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((p) => (
                <tr key={p.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.productSku}</td>
                  <td className="px-4 py-3 text-gray-600">{p.brand || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.providerName || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.providerCode || '—'}</td>
                  <td className="px-4 py-3 text-center"><span className="font-semibold text-red-600">{p.currentStock}</span></td>
                  <td className="px-4 py-3 text-center text-gray-500">{p.minStock}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">-{p.deficit}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab: Por vencer ───────────────────────────────────────────────────────────

function TabExpiring({ businessId }) {
  const t = useT()
  const params = { size: 50, ...(businessId && { businessId }) }
  const { data, isLoading } = useReportsExpiring(params)
  const items = data?.content ?? []

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <CalendarClock size={36} className="text-gray-200" />
          <p className="text-sm text-gray-400">{t('No hay productos por vencer')}</p>
          <p className="text-xs text-gray-300">{t('Aparecen aquí los que vencen dentro de 30 días o ya vencieron')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{t('Producto')}</th>
                <th className="px-4 py-3">{t('Código')}</th>
                <th className="px-4 py-3">{t('Marca')}</th>
                <th className="px-4 py-3">{t('Proveedor')}</th>
                <th className="px-4 py-3 text-center">{t('Stock')}</th>
                <th className="px-4 py-3 text-center">{t('Vence')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((p) => (
                <tr key={p.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.productSku}</td>
                  <td className="px-4 py-3 text-gray-600">{p.brand || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.providerName || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{p.currentStock}</td>
                  <td className="px-4 py-3 text-center">
                    <ExpiryBadge product={{
                      expirationDate: p.expirationDate,
                      expired: p.expired,
                      expiringSoon: !p.expired,
                      daysToExpire: p.daysToExpire,
                    }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab: Resurtido por proveedor ─────────────────────────────────────────────

function TabSupplierRestock({ businessId }) {
  const t = useT()
  const [supplierId, setSupplierId] = useState('')
  const [range, setRange]           = useState({ from: firstOfMonth(), to: today() })
  const { from, to } = range

  const { data: suppliersData } = useSuppliers({ size: 200, ...(businessId && { businessId }) })
  const suppliers = suppliersData?.content ?? []

  const { data: rows = [], isLoading, isFetching } = useSupplierRestock(
    supplierId && from && to ? { supplierId, from, to, ...(businessId && { businessId }) } : null,
  )

  const inputCls = 'rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

  const supplierName = suppliers.find((s) => s.id === supplierId)?.name ?? ''

  const handlePrint = () => {
    printSupplierRestock(supplierName, from, to, rows)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('Proveedor')}</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={`${inputCls} min-w-48`}>
            <option value="">{t('Seleccionar proveedor...')}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <DateRangeQuick from={from} to={to} onChange={setRange} />
        {supplierId && rows.length > 0 && (
          <button
            type="button"
            onClick={handlePrint}
            title={t('Imprimir la lista de productos a pedir de este proveedor')}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer size={15} />
            {t('Imprimir')}
          </button>
        )}
      </div>

      {/* Empty state — no supplier selected */}
      {!supplierId && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Truck size={36} className="text-gray-200" />
          <p className="text-sm text-gray-400">{t('Selecciona un proveedor para ver el resurtido')}</p>
        </div>
      )}

      {/* Loading */}
      {supplierId && (isLoading || isFetching) && (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      )}

      {/* Table */}
      {supplierId && !isLoading && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Package size={36} className="text-gray-200" />
          <p className="text-sm text-gray-400">{t('Este proveedor no tiene productos registrados')}</p>
        </div>
      )}

      {supplierId && !isLoading && rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{t('Producto')}</th>
                <th className="px-4 py-3">{t('Código')}</th>
                <th className="px-4 py-3 text-center">{t('Recibido')}</th>
                <th className="px-4 py-3 text-center">{t('Vendido')}</th>
                <th className="px-4 py-3 text-center">{t('Stock actual')}</th>
                <th className="px-4 py-3 text-center">{t('Stock mínimo')}</th>
                <th className="px-4 py-3 text-center">{t('Sugerido pedir')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const suggested = Math.max(r.sold, Math.max(0, r.minStock - r.currentStock))
                const stockOk   = r.currentStock >= r.minStock
                return (
                  <tr key={r.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.productName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.sku}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.received}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.sold}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${stockOk ? 'text-emerald-600' : 'text-red-600'}`}>
                        {r.currentStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{r.minStock}</td>
                    <td className="px-4 py-3 text-center">
                      {suggested > 0 ? (
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {suggested} {r.unit}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'sales',            label: 'Análisis de ventas' },
  { id: 'daily',            label: 'Resumen del día' },
  { id: 'by-product',       label: 'Por producto' },
  { id: 'by-provider',      label: 'Por proveedor' },
  { id: 'low-stock',        label: 'Stock bajo' },
  { id: 'expiring',         label: 'Por vencer' },
  { id: 'supplier-restock', label: 'Resurtido' },
]

export default function ReportsPage() {
  const t = useT()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'sales')

  const businessId = user?.role === 'SUPER_ADMIN' ? user?.businessId : undefined

  function switchTab(id) {
    setActiveTab(id)
    // Preserve report filters when switching back, but mark the active tab
    const next = new URLSearchParams(searchParams)
    next.set('tab', id)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <PageTitle icon={BarChart2} tone="rose">{t('Reportes')}</PageTitle>
        <HelpDrawer title={t('Cómo usar Reportes')} autoOpenKey="eazystock_reports_help_v2">
          <p>{t('Cada pestaña responde una pregunta distinta sobre tu negocio:')}</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">📈 {t('Análisis de ventas')}</p>
            <p className="mt-1">{t('Gráfico de ventas por día y tabla filtrable por fechas, empleado, proveedor o marca.')} <em>{t('"¿Cómo va el negocio?"')}</em></p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">☀️ {t('Resumen del día')}</p>
            <p className="mt-1">{t('Lo vendido hoy: total en caja, por forma de pago y por vendedor.')} <em>{t('"¿Cómo cerró el día?"')}</em></p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">🏆 {t('Por producto / Por proveedor')}</p>
            <p className="mt-1">{t('Qué productos y proveedores te generan más ventas.')} <strong>{t('Útil para decidir qué reponer y a quién comprarle más.')}</strong></p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">⚠️ {t('Stock bajo')}</p>
            <p className="mt-1">{t('Productos bajo su mínimo con el déficit de cada uno.')} <strong>{t('Elige un proveedor y pulsa Generar PDF: verás una previsual editable del pedido.')}</strong> {t('Quita productos que no quieras pedir, cambia la cantidad (por defecto es el déficit) o agrega productos que no están en stock bajo. El PDF nunca muestra tu stock ni tus precios: solo lo que el proveedor necesita.')}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">📅 {t('Por vencer')}</p>
            <p className="mt-1"><strong>{t('Productos que vencen dentro de 30 días o ya vencieron')}</strong> {t('(según la fecha de vencimiento que cargas en cada producto). Úsalo para hacer promociones antes de perder mercadería o para retirar lo vencido.')} <em>{t('"¿Qué tengo que mover ya?"')}</em></p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">🚚 {t('Resurtido')}</p>
            <p className="mt-1">{t('Por proveedor: lo recibido, lo vendido en el período y una sugerencia de cuánto pedir (lo vendido o lo que falta para el mínimo, lo que sea mayor). Se puede imprimir como lista interna.')}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">🔎 {t('Filtros y cabeceras fijas')}</p>
            <p className="mt-1">{t('Las tablas tienen filtros embudo por columna (como en Excel) y la cabecera queda fija al hacer scroll. Usa Hoy / Esta semana / Este mes o «Elegir fechas» para cambiar el período.')}</p>
          </div>
        </HelpDrawer>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50 p-1.5 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-100'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'sales'            && <TabSalesReport      businessId={businessId} />}
        {activeTab === 'daily'            && <TabDaily            businessId={businessId} />}
        {activeTab === 'by-product'       && <TabByProduct        businessId={businessId} />}
        {activeTab === 'by-provider'      && <TabByProvider       businessId={businessId} />}
        {activeTab === 'low-stock'        && <TabLowStock         businessId={businessId} />}
        {activeTab === 'expiring'         && <TabExpiring         businessId={businessId} />}
        {activeTab === 'supplier-restock' && <TabSupplierRestock  businessId={businessId} />}
      </div>
    </div>
  )
}
