import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingCart, Package, TrendingUp, ArrowUpDown, AlertTriangle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import {
  useDailySummary, useSalesByProduct, useSalesByProvider,
  useReportsLowStock, useSalesReport,
} from '../hooks/useReports'
import ReportFilters   from '../components/reports/ReportFilters'
import SummaryCards    from '../components/reports/SummaryCards'
import SalesByDayChart from '../components/reports/SalesByDayChart'
import TopProductsList from '../components/reports/TopProductsList'
import SalesTable      from '../components/reports/SalesTable'

// ── helpers ───────────────────────────────────────────────────────────────────

function today()        { return new Date().toISOString().slice(0, 10) }
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v)
}
function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
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
  PURCHASE_ENTRY: { label: 'Entrada', cls: 'bg-green-100 text-green-700' },
  SALE:           { label: 'Venta',   cls: 'bg-blue-100  text-blue-700' },
  ADJUSTMENT:     { label: 'Ajuste',  cls: 'bg-amber-100 text-amber-700' },
}

function MovementsTable({ movements }) {
  if (!movements?.length)
    return <p className="py-8 text-center text-sm text-gray-400">Sin movimientos en este período</p>
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Fecha</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Producto</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Tipo</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Cantidad</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Usuario</th>
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
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
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
          <p className="text-sm text-red-600">No pudimos cargar el reporte</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Reintentar
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
  const [date, setDate] = useState(today())
  const params = { date, ...(businessId && { businessId }) }
  const { data, isLoading } = useDailySummary(params)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Fecha</label>
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
            <StatCard icon={ShoppingCart}  label="Ventas realizadas"   value={data?.totalSales    ?? 0}                    iconBg="bg-blue-50"    iconColor="text-blue-500" />
            <StatCard icon={Package}       label="Items vendidos"      value={data?.totalItemsSold ?? 0}                   iconBg="bg-indigo-50"  iconColor="text-indigo-500" />
            <StatCard icon={TrendingUp}    label="Ingresos"            value={formatCurrency(data?.totalRevenue)}          iconBg="bg-emerald-50" iconColor="text-emerald-500" />
            <StatCard icon={ArrowUpDown}   label="Movimientos del día" value={data?.movements?.length ?? 0}                iconBg="bg-amber-50"   iconColor="text-amber-500" />
          </div>
          <MovementsTable movements={data?.movements} />
        </>
      )}
    </div>
  )
}

// ── Tab: Por producto ─────────────────────────────────────────────────────────

function TabByProduct({ businessId }) {
  const [from, setFrom]         = useState(firstOfMonth())
  const [to, setTo]             = useState(today())
  const [reportParams, setReportParams] = useState(null)
  const { data, isLoading } = useSalesByProduct(reportParams, { enabled: !!reportParams })
  const run = () => setReportParams({ from, to, ...(businessId && { businessId }) })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
        </div>
        <button onClick={run} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          Generar reporte
        </button>
      </div>
      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-gray-100" />}
      {data && !isLoading && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 font-mono">SKU</th>
                  <th className="px-4 py-3 text-center">Unidades vendidas</th>
                  <th className="px-4 py-3 text-right">Ingresos totales</th>
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
              <h4 className="mb-4 text-sm font-semibold text-gray-700">Ingresos por producto</h4>
              <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `S/ ${v}`} />
                  <YAxis type="category" dataKey="productName" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Ingresos']} />
                  <Bar dataKey="totalRevenue" fill="#f97316" radius={[0, 4, 4, 0]} />
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
  const [from, setFrom]         = useState(firstOfMonth())
  const [to, setTo]             = useState(today())
  const [reportParams, setReportParams] = useState(null)
  const { data, isLoading } = useSalesByProvider(reportParams, { enabled: !!reportParams })
  const run = () => setReportParams({ from, to, ...(businessId && { businessId }) })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
        </div>
        <button onClick={run} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          Generar reporte
        </button>
      </div>
      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-gray-100" />}
      {data && !isLoading && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3 text-center">Productos distintos</th>
                  <th className="px-4 py-3 text-center">Unidades vendidas</th>
                  <th className="px-4 py-3 text-right">Ingresos totales</th>
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
              <h4 className="mb-4 text-sm font-semibold text-gray-700">Ingresos por proveedor</h4>
              <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `S/ ${v}`} />
                  <YAxis type="category" dataKey="providerName" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Ingresos']} />
                  <Bar dataKey="totalRevenue" fill="#f97316" radius={[0, 4, 4, 0]} />
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
  const params = { size: 50, ...(businessId && { businessId }) }
  const { data, isLoading } = useReportsLowStock(params)
  const items = data?.content ?? []

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <AlertTriangle size={36} className="text-gray-200" />
          <p className="text-sm text-gray-400">No hay productos con stock bajo</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-center">Stock actual</th>
                <th className="px-4 py-3 text-center">Stock mínimo</th>
                <th className="px-4 py-3 text-center">Déficit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((p) => (
                <tr key={p.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.productSku}</td>
                  <td className="px-4 py-3 text-gray-600">{p.brand || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.providerName || '—'}</td>
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

// ── main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'sales',       label: 'Análisis de ventas' },
  { id: 'daily',       label: 'Resumen del día' },
  { id: 'by-product',  label: 'Por producto' },
  { id: 'by-provider', label: 'Por proveedor' },
  { id: 'low-stock',   label: 'Stock bajo' },
]

export default function ReportsPage() {
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
      <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>

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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'sales'       && <TabSalesReport businessId={businessId} />}
        {activeTab === 'daily'       && <TabDaily       businessId={businessId} />}
        {activeTab === 'by-product'  && <TabByProduct   businessId={businessId} />}
        {activeTab === 'by-provider' && <TabByProvider  businessId={businessId} />}
        {activeTab === 'low-stock'   && <TabLowStock    businessId={businessId} />}
      </div>
    </div>
  )
}
