import { useMemo, useState } from 'react'
import {
  Scale, TrendingUp, TrendingDown, Loader2, Calendar,
  Wallet, PackageOpen, PiggyBank, ShoppingCart, Undo2,
} from 'lucide-react'
import { useSalesBalance, useCashBalance, useBusinessOverview } from '../hooks/useReports'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'

const PERIODS = [
  { key: 'day',    label: 'Hoy' },
  { key: 'week',   label: 'Semana' },
  { key: 'month',  label: 'Mes' },
  { key: 'year',   label: 'Año' },
  { key: 'custom', label: 'Personalizado' },
]

function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Rango [from, to] en fechas locales según el período elegido. */
function rangeFor(period) {
  const now = new Date()
  const today = toISODate(now)
  if (period === 'day') return { from: today, to: today }
  if (period === 'week') {
    // Semana de lunes a hoy
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - day)
    return { from: toISODate(monday), to: today }
  }
  if (period === 'month') {
    return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today }
  }
  if (period === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: today }
  }
  return null // custom: lo define el usuario
}

function formatRangeLabel(from, to) {
  if (!from || !to) return ''
  const fmt = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
  const f = fmt.format(new Date(from + 'T00:00:00'))
  const t = fmt.format(new Date(to + 'T00:00:00'))
  return f === t ? f : `${f} — ${t}`
}

function BalanceLine({ label, value, negative = false, muted = false }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className={`font-semibold tabular-nums ${negative ? 'text-red-600' : 'text-gray-900'}`}>
        {negative && Number(value) > 0 ? '−' : ''}{formatPrice(value)}
      </span>
    </div>
  )
}

function OverviewCard({ icon: Icon, label, value, tone, subtitle }) {
  const tones = {
    blue:    'bg-blue-50 text-blue-600',
    amber:   'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red:     'bg-red-50 text-red-600',
  }
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="truncate text-xl font-extrabold text-gray-900">{formatPrice(value)}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

const inputCls = 'rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

export default function BalancePage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('day')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const range = useMemo(() => {
    if (period !== 'custom') return rangeFor(period)
    if (customFrom && customTo) return { from: customFrom, to: customTo }
    return null
  }, [period, customFrom, customTo])

  const baseParams = user?.role === 'SUPER_ADMIN' && user?.businessId
    ? { businessId: user.businessId }
    : {}
  const periodParams = range ? { ...baseParams, ...range } : null

  const salesBalance = useSalesBalance(periodParams, { enabled: !!periodParams })
  const cashBalance  = useCashBalance(periodParams,  { enabled: !!periodParams })
  const overview     = useBusinessOverview(baseParams)

  const sb = salesBalance.data
  const cb = cashBalance.data
  const ov = overview.data

  const profitPositive = sb != null && Number(sb.profit) >= 0
  const cashPositive   = cb != null && Number(cb.profit) >= 0

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Balance del negocio</h2>
          {range && (
            <p className="mt-0.5 text-sm text-gray-400">{formatRangeLabel(range.from, range.to)}</p>
          )}
        </div>
      </div>

      {/* Selector de período */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                period === p.key
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3">
            <Calendar size={15} className="flex-shrink-0 text-gray-400" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Desde</span>
              <input type="date" value={customFrom} max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Hasta</span>
              <input type="date" value={customTo} min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)} className={inputCls} />
            </div>
            {!range && (
              <span className="text-xs text-gray-400">Elige ambas fechas para ver el balance</span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Balance de ventas */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <ShoppingCart size={17} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Balance de ventas</h3>
            </div>
            {sb != null && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                {sb.salesCount} venta{sb.salesCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {!periodParams ? (
            <p className="py-8 text-center text-sm text-gray-400">Selecciona un rango de fechas</p>
          ) : salesBalance.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
          ) : salesBalance.isError ? (
            <p className="py-8 text-center text-sm text-red-500">No pudimos cargar el balance.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              <BalanceLine label="Ventas brutas" value={sb.grossSales} />
              <BalanceLine label="Descuentos" value={sb.discounts} negative />
              <BalanceLine label="Devoluciones" value={sb.returns} negative />
              <BalanceLine label="Costo del producto" value={sb.productCost} negative />
              <div className="flex items-center justify-between pt-3">
                <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  {profitPositive
                    ? <TrendingUp size={15} className="text-emerald-600" />
                    : <TrendingDown size={15} className="text-red-600" />}
                  Ganancia
                </span>
                <span className={`text-xl font-extrabold tabular-nums ${profitPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPrice(sb.profit)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Ingresos y egresos */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Scale size={17} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900">Ingresos y egresos</h3>
          </div>

          {!periodParams ? (
            <p className="py-8 text-center text-sm text-gray-400">Selecciona un rango de fechas</p>
          ) : cashBalance.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
          ) : cashBalance.isError ? (
            <p className="py-8 text-center text-sm text-red-500">No pudimos cargar el reporte.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              <BalanceLine label="Ingresos por ventas" value={cb.income} />
              <BalanceLine label="Devoluciones" value={cb.returnsRefund} negative />
              <BalanceLine label="Ingresos netos" value={cb.netIncome} />
              <BalanceLine label="Egresos (compras a proveedores)" value={cb.expenses} negative />
              <div className="flex items-center justify-between pt-3">
                <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  {cashPositive
                    ? <TrendingUp size={15} className="text-emerald-600" />
                    : <TrendingDown size={15} className="text-red-600" />}
                  Ganancia del período
                </span>
                <span className={`text-xl font-extrabold tabular-nums ${cashPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPrice(cb.profit)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información total del negocio */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
          <PiggyBank size={17} className="text-gray-400" />
          Información total del negocio
          <span className="text-xs font-normal text-gray-400">(inventario actual)</span>
        </h3>
        {overview.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
        ) : overview.isError ? (
          <p className="py-6 text-center text-sm text-red-500">No pudimos cargar la información del negocio.</p>
        ) : ov && (
          <div className="grid gap-4 sm:grid-cols-3">
            <OverviewCard
              icon={Wallet}
              label="Capital total"
              value={ov.capitalTotal}
              tone="blue"
              subtitle={`${ov.productCount} productos en catálogo`}
            />
            <OverviewCard
              icon={PackageOpen}
              label="Costo de productos"
              value={ov.productCostTotal}
              tone="amber"
              subtitle="Stock valorizado al costo de compra"
            />
            <OverviewCard
              icon={Number(ov.potentialProfit) >= 0 ? TrendingUp : Undo2}
              label="Ganancia potencial"
              value={ov.potentialProfit}
              tone={Number(ov.potentialProfit) >= 0 ? 'emerald' : 'red'}
              subtitle="Si se vende todo el stock actual"
            />
          </div>
        )}
      </div>
    </div>
  )
}
