import { useMemo, useState } from 'react'
import {
  Trophy, TrendingUp, ShoppingCart, Package,
  ChevronDown, ChevronRight, Users, Medal,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSellerPerformance } from '../hooks/useReports'

// ── helpers ───────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().slice(0, 10) }
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v)
}

function formatNumber(v) {
  if (v == null) return '0'
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(v)
}

function formatDay(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(`${str}T00:00:00`))
}

const RANK_STYLE = [
  'bg-amber-100 text-amber-700 ring-1 ring-amber-200',   // 1°
  'bg-slate-100 text-slate-600 ring-1 ring-slate-200',   // 2°
  'bg-orange-100 text-orange-700 ring-1 ring-orange-200', // 3°
]

// ── stat card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
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

// ── seller row (expandable) ────────────────────────────────────────────────

function SellerCard({ seller, rank, maxRevenue }) {
  const [open, setOpen] = useState(rank === 0)
  const pct = maxRevenue > 0 ? Math.round((seller.revenue / maxRevenue) * 100) : 0
  const rankCls = RANK_STYLE[rank] ?? 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/60"
      >
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${rankCls}`}>
          {rank < 3 ? <Medal size={16} /> : rank + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-semibold text-gray-900">{seller.employeeName}</p>
            <p className="flex-shrink-0 text-lg font-extrabold text-gray-900">{formatCurrency(seller.revenue)}</p>
          </div>
          {/* Barra proporcional al que más vendió */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span><b className="text-gray-700">{seller.sales}</b> ventas</span>
            <span><b className="text-gray-700">{formatNumber(seller.unitsSold)}</b> unidades</span>
            <span>Ticket prom. <b className="text-gray-700">{formatCurrency(seller.avgTicket)}</b></span>
          </div>
        </div>

        <span className="flex-shrink-0 text-gray-400">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Ventas día por día
          </p>
          {seller.byDay.length === 0 ? (
            <p className="py-3 text-sm text-gray-400">Sin ventas en el período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-gray-400">
                    <th className="py-1.5 pr-4 font-semibold">Día</th>
                    <th className="py-1.5 pr-4 text-center font-semibold">Ventas</th>
                    <th className="py-1.5 text-right font-semibold">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {seller.byDay.map((d) => (
                    <tr key={d.date} className="border-t border-gray-100">
                      <td className="py-2 pr-4 capitalize text-gray-700">{formatDay(d.date)}</td>
                      <td className="py-2 pr-4 text-center text-gray-600">{d.sales}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">{formatCurrency(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function SellerPerformancePage() {
  const { user } = useAuth()
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo]     = useState(today())

  const businessId = user?.businessId
  const params = useMemo(
    () => ({ from, to, ...(businessId ? { businessId } : {}) }),
    [from, to, businessId],
  )

  const { data, isLoading, isError } = useSellerPerformance(params)

  const sellers    = data?.sellers ?? []
  const maxRevenue = sellers.length ? Number(sellers[0].revenue) : 0
  const inputCls   = 'rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Trophy size={22} className="text-amber-500" />
            Rendimiento de vendedores
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Quién vendió más y cuánto exactamente cada día.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Desde
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Hasta
            <input type="date" value={to} min={from} max={today()} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp}  label="Ingresos del período" value={isLoading ? '…' : formatCurrency(data?.totalRevenue)} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatCard icon={ShoppingCart} label="Ventas del período"  value={isLoading ? '…' : (data?.totalSales ?? 0)}             iconBg="bg-blue-50"    iconColor="text-blue-500" />
        <StatCard icon={Users}        label="Vendedores activos"   value={isLoading ? '…' : sellers.length}                       iconBg="bg-indigo-50"  iconColor="text-indigo-500" />
      </div>

      {/* Ranking */}
      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
          No se pudo cargar el rendimiento. Intenta de nuevo.
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
            <Package size={22} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No hay ventas en este período</p>
          <p className="text-xs text-gray-400">Ajusta el rango de fechas para ver resultados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map((s, i) => (
            <SellerCard key={s.employeeId} seller={s} rank={i} maxRevenue={maxRevenue} />
          ))}
        </div>
      )}
    </div>
  )
}
