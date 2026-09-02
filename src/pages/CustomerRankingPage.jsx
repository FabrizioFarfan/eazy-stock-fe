import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Medal, TrendingUp, ShoppingCart, UserRound, MessageCircle, Clock,
  Star, Package, X, Search, ChevronRight, UserX, CircleHelp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCustomerRanking, useInactiveCustomers } from '../hooks/useReports'
import { useProductSearch } from '../hooks/useProducts'
import { useDebounce } from '../hooks/useDebounce'
import LoadMoreRow from '../components/common/LoadMoreRow'
import HelpDrawer from '../components/common/HelpDrawer'
import { formatPrice } from '../utils/formatMoney'
import { formatQty } from '../utils/quantity'
import { whatsappDigits } from '../utils/phone'
import { localISODate } from '../utils/formatDate'
import { useT, dateLocale } from '../i18n'

// ── helpers ───────────────────────────────────────────────────────────────────

function today() { return localISODate() }
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function daysAgoISO(n) {
  const d = new Date(); d.setDate(d.getDate() - n)
  return localISODate(d)
}

function formatDay(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}

function daysSince(str) {
  if (!str) return null
  return Math.floor((Date.now() - new Date(str).getTime()) / 86400000)
}

function daysAgoLabel(days, t) {
  if (days == null) return '—'
  if (days === 0) return t('hoy')
  if (days === 1) return t('ayer')
  return t('hace {n} días', { n: days })
}

/** wa.me con saludo listo; null si el cliente no tiene teléfono. */
function whatsappUrl(phone, message) {
  const digits = whatsappDigits(phone)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

const RANK_STYLE = [
  'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
]

const PRESETS = [
  { key: 'month', label: 'Este mes' },
  { key: '30',    label: '30 días' },
  { key: '90',    label: '90 días' },
  { key: 'year',  label: 'Este año' },
  { key: 'all',   label: 'Todo' },
]

const inputCls = 'rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, hint, iconBg, iconColor }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon size={19} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold text-gray-900">{value}</p>
        {hint && <p className="truncate text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  )
}

// ── fila del ranking ──────────────────────────────────────────────────────────

function CustomerRow({ row, rank, maxRevenue, sort, businessName, productName }) {
  const t = useT()
  const navigate = useNavigate()
  const pct = maxRevenue > 0 ? Math.round((Number(row.revenue) / maxRevenue) * 100) : 0
  const rankCls = RANK_STYLE[rank] ?? 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
  const since = daysSince(row.lastPurchaseAt)
  const greeting = productName
    ? t('Hola {name}, te saludamos de {business}. Tenemos novedades en {product}, ¿te interesa?', { name: row.customerName, business: businessName || t('nuestro negocio'), product: productName })
    : t('Hola {name}, te saludamos de {business}. ¡Gracias por ser de nuestros mejores clientes!', { name: row.customerName, business: businessName || t('nuestro negocio') })
  const wa = whatsappUrl(row.phone, greeting)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:gap-4 sm:px-5">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${rankCls}`}>
        {rank < 3 ? <Medal size={16} /> : rank + 1}
      </div>

      <button type="button" onClick={() => navigate(`/customers/${row.customerId}`)} className="min-w-0 flex-1 text-left">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate font-semibold text-gray-900 hover:text-blue-700">{row.customerName}</p>
          <p className="flex-shrink-0 text-base font-extrabold text-gray-900">
            {sort === 'count' ? t('{n} compras', { n: row.sales }) : formatPrice(row.revenue)}
          </p>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
          {sort === 'count'
            ? <span><b className="text-gray-700">{formatPrice(row.revenue)}</b></span>
            : <span><b className="text-gray-700">{row.sales}</b> {t('compras')}</span>}
          <span>{t('Ticket prom.')} <b className="text-gray-700">{formatPrice(row.avgTicket)}</b></span>
          <span className="flex items-center gap-1"><Clock size={11} /> {daysAgoLabel(since, t)}</span>
          {row.topProductName && (
            <span className="flex items-center gap-1 truncate">
              <Star size={11} className="text-amber-500" />
              <span className="truncate">{row.topProductName}</span>
              {row.topProductQuantity != null && <span className="text-gray-400">· {formatQty(row.topProductQuantity)} {row.topProductUnit || ''}</span>}
            </span>
          )}
        </div>
      </button>

      <div className="flex flex-shrink-0 items-center gap-1">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" title={t('Escribirle por WhatsApp')}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
            <MessageCircle size={15} />
          </a>
        )}
        <button type="button" onClick={() => navigate(`/customers/${row.customerId}`)} title={t('Ver ficha')}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── inactivos ─────────────────────────────────────────────────────────────────

function InactiveSection({ businessId, businessName }) {
  const t = useT()
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const params = useMemo(() => ({ days, ...(businessId ? { businessId } : {}) }), [days, businessId])
  const { data, isLoading } = useInactiveCustomers(params)
  const rows = data?.customers ?? []

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <UserX size={15} className="text-red-500" />
            {t('Sin comprar hace más de {n} días', { n: days })}
            {!isLoading && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{rows.length}</span>}
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">{t('Clientes que ya te compraron y no vuelven. Un WhatsApp a tiempo los trae de regreso.')}</p>
        </div>
        <div className="flex gap-1.5">
          {[30, 60, 90].map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === d ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {d} {t('días')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}</div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('Ningún cliente lleva tanto sin comprar. ¡Buena señal!')}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => {
            const msg = t('Hola {name}, te saludamos de {business}. Hace un tiempo no te vemos por acá, ¡te esperamos cuando quieras!', { name: r.customerName, business: businessName || t('nuestro negocio') })
            const wa = whatsappUrl(r.phone, msg)
            return (
              <li key={r.customerId} className="flex items-center gap-3 py-2.5">
                <button type="button" onClick={() => navigate(`/customers/${r.customerId}`)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-gray-900 hover:text-blue-700">{r.customerName}</p>
                  <p className="text-xs text-gray-400">
                    {t('Última compra')}: {formatDay(r.lastPurchaseAt)} · <b className="text-red-600">{t('hace {n} días', { n: r.daysSinceLastPurchase })}</b>
                    {' · '}{t('{n} compras', { n: r.totalSales })} · {formatPrice(r.totalSpent)}
                    {Number(r.currentDebt) > 0 && <> · <span className="text-amber-600">{t('debe')} {formatPrice(r.currentDebt)}</span></>}
                  </p>
                </button>
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" title={t('Escribirle por WhatsApp')}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                    <MessageCircle size={15} />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function CustomerRankingPage() {
  const t = useT()
  const { user } = useAuth()
  const businessId = user?.businessId

  const [preset, setPreset] = useState('month')
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo]     = useState(today())
  const [sort, setSort] = useState('amount')

  // Filtro por producto («¿a quién le vendí cemento?»)
  const [product, setProduct] = useState(null)         // {id, name} | null
  const [productQuery, setProductQuery] = useState('')
  const [showProdDrop, setShowProdDrop] = useState(false)
  const debouncedProd = useDebounce(productQuery, 350)
  const prodSearch = useProductSearch(debouncedProd)

  const applyPreset = (key) => {
    setPreset(key)
    if (key === 'month') { setFrom(firstOfMonth()); setTo(today()) }
    else if (key === '30') { setFrom(daysAgoISO(30)); setTo(today()) }
    else if (key === '90') { setFrom(daysAgoISO(90)); setTo(today()) }
    else if (key === 'year') { setFrom(`${new Date().getFullYear()}-01-01`); setTo(today()) }
    else if (key === 'all') { setFrom('2000-01-01'); setTo(today()) }
  }

  const params = useMemo(() => ({
    from, to, sort,
    ...(product ? { productId: product.id } : {}),
    ...(businessId ? { businessId } : {}),
  }), [from, to, sort, product, businessId])

  const { data, isLoading, isError } = useCustomerRanking(params)
  const rows = data?.customers ?? []
  const maxRevenue = rows.length ? Math.max(...rows.map((r) => Number(r.revenue))) : 0
  const pctWithCustomer = data && data.totalSales > 0
    ? Math.round((data.salesWithCustomer / data.totalSales) * 100) : null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Users size={22} className="text-blue-600" />
              {t('Mejores clientes')}
            </h2>
            <HelpDrawer title={t('Cómo usar Mejores clientes')} autoOpenKey="eazystock_customer_ranking_help_v1">
              <p>{t('Responde')} <strong>{t('quién te compra más, qué le vendes y cada cuánto vuelve')}</strong>. {t('Se alimenta de las ventas que llevan cliente.')}</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="font-semibold text-gray-800">🧾 {t('De dónde salen los datos')}</p>
                <p className="mt-1">{t('En Nueva venta hay un botón «Asociar cliente» (opcional, no frena la caja). El fiado ya lo lleva siempre. Las ventas viejas se asocian desde su detalle en Ventas. Arriba ves cuántas ventas del período quedaron sin cliente.')}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="font-semibold text-gray-800">🏅 {t('Por monto o por frecuencia')}</p>
                <p className="mt-1">{t('«Por monto» ordena por lo que gastaron; «Por frecuencia» por cuántas veces vinieron. Cada fila muestra el ticket promedio, la última compra y el producto que más le vendes. Toca el nombre para abrir su ficha.')}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="font-semibold text-gray-800">📦 {t('Filtrar por producto')}</p>
                <p className="mt-1">{t('Escribe un producto y el ranking queda solo con quienes lo compraron en el período: ideal para avisarles de una promoción por WhatsApp con un toque.')}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="font-semibold text-gray-800">😴 {t('Sin comprar hace X días')}</p>
                <p className="mt-1">{t('Abajo, los clientes que ya te compraron y no vuelven hace 30, 60 o 90 días, con el botón de WhatsApp para traerlos de regreso.')}</p>
              </div>
            </HelpDrawer>
          </div>
          <p className="mt-1 text-sm text-gray-400">{t('Quién te compra más, qué le vendes y cada cuánto vuelve.')}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button key={p.key} type="button" onClick={() => applyPreset(p.key)}
                className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors ${
                  preset === p.key ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                {t(p.label)}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            {t('Desde')}
            <input type="date" value={from} max={to} onChange={(e) => { setFrom(e.target.value); setPreset('') }} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            {t('Hasta')}
            <input type="date" value={to} min={from} max={today()} onChange={(e) => { setTo(e.target.value); setPreset('') }} className={inputCls} />
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label={t('Comprado con cliente')} value={isLoading ? '…' : formatPrice(data?.revenueWithCustomer ?? 0)}
          hint={data ? t('de {total} en el período', { total: formatPrice(data.totalRevenue) }) : undefined}
          iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatCard icon={ShoppingCart} label={t('Ventas con cliente')} value={isLoading ? '…' : (data?.salesWithCustomer ?? 0)}
          hint={pctWithCustomer != null ? t('{pct}% de las ventas', { pct: pctWithCustomer }) : undefined}
          iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatCard icon={UserRound} label={t('Clientes que compraron')} value={isLoading ? '…' : rows.length}
          iconBg="bg-indigo-50" iconColor="text-indigo-500" />
        <StatCard icon={CircleHelp} label={t('Ventas sin cliente')} value={isLoading ? '…' : (data?.salesWithoutCustomer ?? 0)}
          hint={data ? `${formatPrice(data.revenueWithoutCustomer)} · ${t('asócialas desde el detalle de la venta')}` : undefined}
          iconBg="bg-gray-100" iconColor="text-gray-500" />
      </div>

      {/* Controls: orden + producto */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex rounded-xl border border-gray-200 p-0.5">
          {[['amount', 'Por monto'], ['count', 'Por frecuencia']].map(([k, label]) => (
            <button key={k} type="button" onClick={() => setSort(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                sort === k ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {t(label)}
            </button>
          ))}
        </div>

        <div className="relative min-w-[16rem] flex-1">
          {product ? (
            <div className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <Package size={14} className="flex-shrink-0" />
              <span className="min-w-0 flex-1 truncate">{t('Quienes compraron')} <b>{product.name}</b></span>
              <button type="button" onClick={() => setProduct(null)} aria-label={t('Quitar')} className="rounded-full p-0.5 hover:bg-blue-100"><X size={13} /></button>
            </div>
          ) : (
            <>
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={productQuery}
                onChange={(e) => { setProductQuery(e.target.value); setShowProdDrop(true) }}
                onFocus={() => setShowProdDrop(true)}
                onBlur={() => setTimeout(() => setShowProdDrop(false), 150)}
                placeholder={t('¿Quién compró tal producto? Escribe para filtrar…')}
                className={`${inputCls} w-full pl-9`}
              />
              {showProdDrop && debouncedProd && (
                <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
                  {prodSearch.isLoading ? (
                    <p className="px-4 py-3 text-sm text-gray-400">{t('Buscando...')}</p>
                  ) : prodSearch.items.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">{t('Sin resultados')}</p>
                  ) : (
                    <>
                      {prodSearch.items.map((p) => (
                        <button key={p.id} type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setProduct({ id: p.id, name: p.name }); setProductQuery(''); setShowProdDrop(false) }}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50">
                          <span className="truncate text-gray-800">{p.name}</span>
                          <span className="ml-2 flex-shrink-0 font-mono text-xs text-gray-400">{p.sku}</span>
                        </button>
                      ))}
                      <LoadMoreRow search={prodSearch} />
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ranking */}
      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
          {t('No se pudo cargar el ranking. Intenta de nuevo.')}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50"><Users size={22} className="text-gray-300" /></div>
          <p className="text-sm font-medium text-gray-600">{t('Todavía no hay ventas con cliente en este período')}</p>
          <p className="max-w-md text-xs text-gray-400">
            {t('Asocia el cliente al cobrar (botón «Asociar cliente» en Nueva venta) o etiqueta ventas pasadas desde su detalle. Desde ese momento el ranking se arma solo.')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <CustomerRow key={r.customerId} row={r} rank={i} maxRevenue={maxRevenue} sort={sort}
              businessName={user?.businessName} productName={product?.name} />
          ))}
        </div>
      )}

      <InactiveSection businessId={businessId} businessName={user?.businessName} />
    </div>
  )
}
