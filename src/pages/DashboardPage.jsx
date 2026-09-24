import { formatPrice } from '../utils/formatMoney'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, TrendingUp, ArrowUpDown,
  AlertTriangle, Building2, Users, CheckCircle2,
  FileText, ArrowRight, CalendarClock, UserX, UserRound, TrendingDown,
  CalendarDays, PackagePlus, BarChart3, ArrowDownToLine, SlidersHorizontal, Undo2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDailySummary, useReportsLowStock, useReportsExpiring, useCustomerRanking, useInactiveCustomers, useSalesBalance } from '../hooks/useReports'
import { formatQty } from '../utils/quantity'
import ExpiryBadge from '../components/common/ExpiryBadge'
import { useBusinesses } from '../hooks/useBusinesses'
import { useUsers } from '../hooks/useUsers'
import { useSales } from '../hooks/useSales'
import { useProducts } from '../hooks/useProducts'
import HelpDrawer from '../components/common/HelpDrawer'
import CashFloatCard from '../components/dashboard/CashFloatCard'
import { localISODate } from '../utils/formatDate'
import { useT, dateLocale } from '../i18n'

function todayStr() {
  return localISODate()
}

function todayLabel() {
  return new Intl.DateTimeFormat(dateLocale(), {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
}

function formatCurrency(amount) {
  return formatPrice(amount) // moneda del negocio
}

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(str))
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-100" />
      <div className="flex-1">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        <div className="mt-2 h-7 w-16 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}

function PageHeader({ name }) {
  const t = useT()
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {name ? t('Bienvenido, {name}', { name: name.split(' ')[0] }) : t('Bienvenido')} 👋
        </h2>
        <p className="mt-1 text-sm capitalize text-gray-400">{todayLabel()}</p>
      </div>
      <HelpDrawer title={t('Qué muestra el Dashboard')} autoOpenKey="eazystock_dashboard_help_v2">
        <p>{t('Tu negocio')} <strong>{t('de un vistazo')}</strong>, {t('actualizado en tiempo real.')}</p>
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
          <p className="font-semibold text-gray-800">📊 {t('Lo de arriba')}</p>
          <p className="mt-1">{t('La franja azul muestra lo que vendiste hoy y cuánto cambió contra ayer, con número de ventas, ticket promedio y unidades. Al lado, lo vendido y la ganancia del mes, y «Pide tu atención»: stock bajo, productos por vencer y clientes que no vuelven, cada uno lleva a su reporte.')}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
          <p className="font-semibold text-gray-800">🕒 {t('«Hoy» según tu hora local')}</p>
          <p className="mt-1">{t('El día se calcula con la hora de tu dispositivo, no la del servidor: lo que vendas por la tarde o la noche cuenta para hoy.')}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
          <p className="font-semibold text-gray-800">⚠️ {t('Stock bajo y por vencer')}</p>
          <p className="mt-1">{t('Alertas de stock bajo lista los productos por debajo de su stock mínimo con el déficit. Productos por vencer aparece solo si hay productos que vencen dentro de 30 días o ya vencieron (según la fecha de vencimiento que cargas en cada producto). Ambos tienen su reporte completo en Reportes.')}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
          <p className="font-semibold text-gray-800">🧭 {t('¿Y después?')}</p>
          <p className="mt-1">{t('Todo lo que ves acá tiene su página completa en el menú: Ventas, Stock, Reportes… Este es solo el resumen. Con los accesos grandes creas una venta, un presupuesto o una entrada de mercadería en un toque.')}</p>
        </div>
      </HelpDrawer>
    </div>
  )
}

// ── Super Admin ───────────────────────────────────────────────────────────────

function SuperAdminDashboard({ name }) {
  const t = useT()
  const navigate = useNavigate()

  const { data: bizPage, isLoading: loadingBiz } = useBusinesses({ page: 0, size: 5, sort: 'createdAt,desc' })
  const { data: usersPage, isLoading: loadingUsers } = useUsers({ page: 0, size: 1 })

  const businesses  = bizPage?.content       ?? []
  const totalBiz    = bizPage?.totalElements ?? 0
  const activeBiz   = businesses.filter((b) => b.active).length
  const totalUsers  = usersPage?.totalElements ?? 0
  const isLoading   = loadingBiz || loadingUsers

  return (
    <div className="flex flex-col gap-6">
      <PageHeader name={name} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Building2}    label={t('Total negocios')}   value={totalBiz}         iconBg="bg-blue-50"   iconColor="text-blue-500" />
            <StatCard icon={CheckCircle2} label={t('Negocios activos')} value={activeBiz}         iconBg="bg-emerald-50" iconColor="text-emerald-500" />
            <StatCard icon={Users}        label={t('Total usuarios')}   value={totalUsers}        iconBg="bg-indigo-50" iconColor="text-indigo-500" />
            <StatCard icon={TrendingUp}   label={t('Nuevos este mes')}  value={businesses.length} iconBg="bg-amber-50"  iconColor="text-amber-500" />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">{t('Acciones rápidas')}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/admin/businesses')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            <Building2 size={15} />
            {t('Nuevo negocio')}
          </button>
          <button
            onClick={() => navigate('/admin/owners')}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Users size={15} />
            {t('Nuevo owner')}
          </button>
        </div>
      </div>

      {/* Recent businesses */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900">{t('Negocios recientes')}</h3>
        </div>
        {loadingBiz ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">{t('No hay negocios registrados aún')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60 text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Nombre')}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('País')}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">RUC</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 text-center">{t('Estado')}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Registrado')}</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="max-w-[180px] truncate px-6 py-3.5 font-medium text-gray-900">{b.name}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{b.countryCode}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{b.taxId}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        b.active
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.active ? t('Activo') : t('Inactivo')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-400">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-gray-50 px-6 py-3.5">
          <button
            onClick={() => navigate('/admin/businesses')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {t('Ver todos los negocios')} →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Owner ─────────────────────────────────────────────────────────────────────

const TYPE_LABEL = { PURCHASE_ENTRY: 'Entrada', SALE: 'Venta', ADJUSTMENT: 'Ajuste', RETURN: 'Devolución', SUPPLIER_RETURN: 'Devuelto a proveedor' }
const TYPE_CLS   = {
  PURCHASE_ENTRY: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  SALE:           'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  ADJUSTMENT:     'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  RETURN:         'bg-purple-50 text-purple-700 ring-1 ring-purple-100',
  SUPPLIER_RETURN: 'bg-purple-50 text-purple-700 ring-1 ring-purple-100',
}

// ── Clientes este mes (tarea 250) ─────────────────────────────────────────────
// Lo que el dueño quiere ver sin entrar a reportes: cuántos clientes compraron,
// qué parte de las ventas lleva nombre, el podio y cuántos no vuelven.

function firstOfMonthStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function MiniStat({ label, value, hint, tone = 'text-gray-900' }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-400">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${tone}`}>{value}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function CustomersBlock({ scopeParams }) {
  const t = useT()
  const navigate = useNavigate()
  const { data: ranking, isLoading } = useCustomerRanking({ from: firstOfMonthStr(), to: todayStr(), sort: 'amount', ...scopeParams })
  const { data: inactive } = useInactiveCustomers({ days: 30, ...scopeParams })

  const rows = ranking?.customers ?? []
  const top = rows.slice(0, 3)
  const inactiveCount = inactive?.customers?.length ?? 0
  const pct = ranking && ranking.totalSales > 0 ? Math.round((ranking.salesWithCustomer / ranking.totalSales) * 100) : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <PanelHeader icon={UserRound} iconCls="bg-indigo-50 text-indigo-600" title={t('Clientes este mes')}
        action={t('Ver análisis')} onAction={() => navigate('/reports/customers')} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label={t('Clientes que compraron')} value={rows.length} />
            <MiniStat label={t('Ventas con cliente')} value={`${pct}%`}
              hint={t('{n} de {total}', { n: ranking?.salesWithCustomer ?? 0, total: ranking?.totalSales ?? 0 })} />
            <MiniStat label={t('Sin volver hace +30 días')} value={inactiveCount}
              tone={inactiveCount > 0 ? 'text-red-600' : 'text-emerald-600'} />
          </div>

          {top.length === 0 ? (
            <p className="text-xs text-gray-400">
              {t('Todavía no hay ventas con cliente este mes.')} {t('Asocia el cliente al cobrar en Nueva venta y aquí verás quién te compra más.')}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {top.map((r, i) => (
                <li key={r.customerId}>
                  <button onClick={() => navigate(`/customers/${r.customerId}`, { state: { from: '/', fromLabel: 'Inicio' } })}
                    className="flex w-full items-center gap-3 py-2 text-left hover:bg-gray-50">
                    <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{r.customerName}</span>
                    <span className="text-xs text-gray-400">{t('{n} compras', { n: r.sales })}</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(r.revenue)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {inactiveCount > 0 && (
            <button onClick={() => navigate('/reports/customers')}
              className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-left text-xs font-medium text-red-700 hover:bg-red-100">
              <UserX size={13} className="flex-shrink-0" />
              {t('{n} cliente(s) ya te compraron y no vuelven hace más de 30 días. Un WhatsApp los trae de regreso.', { n: inactiveCount })}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localISODate(d)
}

// Cabecera de cada panel: ícono + título + acción a la derecha (siempre visible)
function PanelHeader({ icon: Icon, iconCls, title, badge, action, onAction }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3.5">
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
        <Icon size={15} />
      </div>
      <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900">{title}</h3>
      {badge}
      {action && (
        <button onClick={onAction}
          className="ml-auto flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          {action} <ArrowRight size={13} />
        </button>
      )}
    </div>
  )
}

// Acceso grande: ícono + nombre + para qué sirve. Se entiende sin leer el menú.
function ActionTile({ icon: Icon, label, hint, onClick, primary }) {
  return (
    <button onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
        primary
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700'
          : 'border border-gray-100 bg-white shadow-sm hover:border-blue-200 hover:shadow-md'
      }`}>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
        primary ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${primary ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        <p className={`truncate text-xs ${primary ? 'text-white/80' : 'text-gray-400'}`}>{hint}</p>
      </div>
      <ArrowRight size={15} className={`flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${primary ? 'text-white/80' : 'text-gray-300'}`} />
    </button>
  )
}

// Variación contra ayer: ▲ verde / ▼ rojo / «igual». Sin ventas ayer no hay %.
function DeltaVsYesterday({ today, yesterday }) {
  const t = useT()
  const a = Number(today ?? 0), b = Number(yesterday ?? 0)
  if (b <= 0) {
    return <span className="text-xs text-white/80">{t('Ayer: {v}', { v: formatCurrency(b) })}</span>
  }
  const pct = Math.round(((a - b) / b) * 100)
  const up = pct >= 0
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs text-white/80">
      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 font-bold text-white">
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {pct === 0 ? t('igual') : `${up ? '+' : ''}${pct}%`}
      </span>
      {t('vs ayer ({v})', { v: formatCurrency(b) })}
    </span>
  )
}

function TodayHero({ summary, yesterday, loading }) {
  const t = useT()
  const sales   = summary?.totalSales ?? 0
  const revenue = Number(summary?.totalRevenue ?? 0)
  const avg     = sales > 0 ? revenue / sales : 0
  return (
    <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-5 text-white shadow-md shadow-blue-600/30 sm:p-6 lg:col-span-2" data-testid="today-hero">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />
      <p className="relative text-xs font-semibold uppercase tracking-widest text-white/80">{t('Ingresos de hoy')}</p>
      {loading ? (
        <div className="relative mt-2 h-10 w-40 animate-pulse rounded-lg bg-white/20" />
      ) : (
        <>
          <p className="relative mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{formatCurrency(revenue)}</p>
          <div className="relative mt-2"><DeltaVsYesterday today={revenue} yesterday={yesterday?.totalRevenue} /></div>
        </>
      )}
      <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-white/20 pt-4">
        {[
          [t('Ventas'), loading ? '—' : sales],
          [t('Ticket promedio'), loading ? '—' : formatCurrency(avg)],
          [t('Unidades'), loading ? '—' : formatQty(summary?.totalItemsSold ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/70">{label}</p>
            <p className="truncate text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthCard({ scopeParams }) {
  const t = useT()
  const navigate = useNavigate()
  const { data, isLoading } = useSalesBalance({ from: firstOfMonthStr(), to: todayStr(), ...scopeParams })
  const monthName = new Intl.DateTimeFormat(dateLocale(), { month: 'long' }).format(new Date())
  const profit = Number(data?.profit ?? 0)
  return (
    <button onClick={() => navigate('/reports/balance')}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <CalendarDays size={15} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t('Este mes')} · <span className="capitalize">{monthName}</span>
        </p>
      </div>
      {isLoading ? (
        <div className="mt-3 h-8 w-32 animate-pulse rounded-lg bg-gray-100" />
      ) : (
        <>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">{formatCurrency(data?.netSales ?? 0)}</p>
          <p className="text-xs text-gray-400">{t('vendido en {n} ventas', { n: data?.salesCount ?? 0 })}</p>
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
            <span className="text-xs text-gray-500">{t('Ganancia')}</span>
            <span className={`text-base font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(profit)}</span>
          </div>
        </>
      )}
      <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700">
        {t('Ver balance')} <ArrowRight size={13} />
      </span>
    </button>
  )
}

// Lo que pide atención HOY, cada fila lleva a su reporte
function AttentionCard({ lowCount, expCount, inactiveCount, loading }) {
  const t = useT()
  const navigate = useNavigate()
  const rows = [
    { key: 'low', icon: AlertTriangle, n: lowCount, label: t('productos con stock bajo'), to: '/reports?tab=low-stock', bad: 'bg-red-50 text-red-600' },
    { key: 'exp', icon: CalendarClock, n: expCount, label: t('productos por vencer'), to: '/reports?tab=expiring', bad: 'bg-amber-50 text-amber-600' },
    { key: 'cli', icon: UserX, n: inactiveCount, label: t('clientes sin volver +30 días'), to: '/reports/customers', bad: 'bg-indigo-50 text-indigo-600' },
  ]
  const allGood = !loading && rows.every((r) => !r.n)
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-3 xl:col-span-1">
      <PanelHeader icon={AlertTriangle} iconCls="bg-amber-50 text-amber-600" title={t('Pide tu atención')} />
      {allGood ? (
        <div className="flex flex-1 items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={20} /></div>
          <p className="text-sm font-medium text-gray-600">{t('Todo en orden: sin alertas por ahora.')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map(({ key, icon: Icon, n, label, to, bad }) => (
            <li key={key}>
              <button onClick={() => navigate(to)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-gray-50">
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${n ? bad : 'bg-gray-100 text-gray-400'}`}><Icon size={15} /></span>
                <span className={`text-lg font-bold ${n ? 'text-gray-900' : 'text-gray-300'}`}>{loading ? '…' : (n ?? 0)}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-gray-500">{label}</span>
                <ArrowRight size={14} className="flex-shrink-0 text-gray-300" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LowStockPanel({ items, total, loading }) {
  const t = useT()
  const navigate = useNavigate()
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <PanelHeader icon={AlertTriangle} iconCls="bg-red-50 text-red-600" title={t('Stock bajo')}
        badge={!loading && total > 0 && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-100">{total}</span>
        )}
        action={total > 0 ? t('Ver todos') : null} onAction={() => navigate('/reports?tab=low-stock')} />
      {loading ? (
        <div className="space-y-3 p-5">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-100" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-sm font-medium text-gray-700">{t('Todo el stock está en orden')}</p>
            <p className="text-xs text-gray-400">{t('Ningún producto está por debajo del mínimo')}</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.slice(0, 6).map((item) => {
            const pct = item.minStock > 0 ? Math.max(0, Math.min(100, (item.currentStock / item.minStock) * 100)) : 0
            const empty = Number(item.currentStock) <= 0
            return (
              <li key={item.productId} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium text-gray-900" title={item.productName}>{item.productName}</p>
                  <p className="flex-shrink-0 text-xs text-gray-500">
                    <span className={`font-bold ${empty ? 'text-red-600' : 'text-gray-900'}`}>{formatQty(item.currentStock)}</span>
                    {' / '}{formatQty(item.minStock)}
                  </p>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${empty ? 'bg-red-500' : pct < 50 ? 'bg-orange-500' : 'bg-amber-400'}`} style={{ width: `${Math.max(pct, 3)}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-gray-400">{item.productSku}</span>
                  <span className="text-[11px] font-semibold text-red-600">{t('faltan {n}', { n: formatQty(item.deficit) })}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ExpiringPanel({ items, total }) {
  const t = useT()
  const navigate = useNavigate()
  if (items.length === 0) return null
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <PanelHeader icon={CalendarClock} iconCls="bg-amber-50 text-amber-600" title={t('Productos por vencer')}
        badge={<span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">{total}</span>}
        action={t('Ver todos')} onAction={() => navigate('/reports?tab=expiring')} />
      <ul className="divide-y divide-gray-100">
        {items.slice(0, 5).map((item) => (
          <li key={item.productId} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900" title={item.productName}>{item.productName}</p>
              <p className="text-xs text-gray-400">{t('Stock')}: {formatQty(item.currentStock)}</p>
            </div>
            <ExpiryBadge product={{
              expirationDate: item.expirationDate,
              expired: item.expired,
              expiringSoon: !item.expired,
              daysToExpire: item.daysToExpire,
            }} />
          </li>
        ))}
      </ul>
    </div>
  )
}

const TYPE_ICON = { PURCHASE_ENTRY: ArrowDownToLine, SALE: ShoppingCart, ADJUSTMENT: SlidersHorizontal, RETURN: Undo2, SUPPLIER_RETURN: Undo2 }

function MovementsPanel({ movements }) {
  const t = useT()
  const navigate = useNavigate()
  const timeOf = (iso) => iso ? new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <PanelHeader icon={ArrowUpDown} iconCls="bg-blue-50 text-blue-600" title={t('Movimientos de hoy')}
        badge={movements.length > 0 && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{movements.length}</span>}
        action={t('Ver todos')} onAction={() => navigate('/stock')} />
      {movements.length === 0 ? (
        <p className="p-5 text-sm text-gray-400">{t('Todavía no hay movimientos hoy. Las ventas, entradas y ajustes aparecen aquí al momento.')}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {movements.slice(0, 8).map((m) => {
            const Icon = TYPE_ICON[m.type] ?? ArrowUpDown
            const qty = Number(m.quantity)
            return (
              <li key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${TYPE_CLS[m.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900" title={m.productName}>{m.productName}</p>
                  <p className="truncate text-xs text-gray-400">
                    {TYPE_LABEL[m.type] ? t(TYPE_LABEL[m.type]) : m.type}{m.createdByName ? ` · ${m.createdByName}` : ''}{m.createdAt ? ` · ${timeOf(m.createdAt)}` : ''}
                  </p>
                </div>
                <span className={`flex-shrink-0 text-sm font-bold ${qty > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {qty > 0 ? `+${formatQty(qty)}` : formatQty(qty)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function OwnerDashboard({ name, businessId }) {
  const t = useT()
  const navigate    = useNavigate()
  const scopeParams = businessId ? { businessId } : {}

  // Fecha explícita del navegador: el server está en Europa y su "hoy" empieza
  // a las 19:00 de Lima — sin esto el resumen salía en 0 por las tardes.
  const { data: summary,      isLoading: loadingSummary } = useDailySummary({ date: todayStr(), ...scopeParams })
  const { data: ySummary }                                 = useDailySummary({ date: yesterdayStr(), ...scopeParams })
  const { data: lowStockPage, isLoading: loadingLow }     = useReportsLowStock({ size: 10, ...scopeParams })
  const { data: expiringPage, isLoading: loadingExp }     = useReportsExpiring({ size: 10, ...scopeParams })
  const { data: inactive }                                = useInactiveCustomers({ days: 30, ...scopeParams })

  const lowStock  = lowStockPage?.content ?? []
  const expiring  = expiringPage?.content ?? []
  const movements = summary?.movements    ?? []

  // Rediseño 25-sep (Frank): arriba lo que importa HOY (plata, comparación con
  // ayer, el mes y lo que pide atención); después los accesos grandes y dos
  // columnas con listas compactas en vez de tablas anchas.
  return (
    <div className="flex flex-col gap-5">
      <PageHeader name={name} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <TodayHero summary={summary} yesterday={ySummary} loading={loadingSummary} />
        <MonthCard scopeParams={scopeParams} />
        <AttentionCard loading={loadingLow || loadingExp}
          lowCount={lowStockPage?.totalElements} expCount={expiringPage?.totalElements}
          inactiveCount={inactive?.customers?.length} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ActionTile primary icon={ShoppingCart} label={t('Nueva venta')} hint={t('Cobrar y descontar stock')} onClick={() => navigate('/sales/new')} />
        <ActionTile icon={FileText} label={t('Nuevo presupuesto')} hint={t('Cotización en PDF o WhatsApp')} onClick={() => navigate('/cotizaciones')} />
        <ActionTile icon={PackagePlus} label={t('Registrar entrada')} hint={t('Mercadería del proveedor')} onClick={() => navigate('/stock?tab=receipts')} />
        <ActionTile icon={BarChart3} label={t('Reportes')} hint={t('Ventas, ganancias y vendedores')} onClick={() => navigate('/reports')} />
      </div>

      {/* Fondo de caja del día (William, 15-sep): el sencillo para dar vuelto */}
      <CashFloatCard canRegister canSeeDrawer scopeParams={scopeParams} />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          <LowStockPanel items={lowStock} total={lowStockPage?.totalElements ?? 0} loading={loadingLow} />
          <MovementsPanel movements={movements} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          {/* Clientes este mes (tarea 250) */}
          <CustomersBlock scopeParams={scopeParams} />
          <ExpiringPanel items={expiring} total={expiringPage?.totalElements ?? 0} />
        </div>
      </div>
    </div>
  )
}

// ── Employee ──────────────────────────────────────────────────────────────────

function EmployeeDashboard({ name }) {
  const t = useT()
  const navigate = useNavigate()
  const { can }  = useAuth()
  const today    = todayStr()

  const { data: salesPage,  isLoading: loadingSales }    = useSales({ from: today, to: today })
  const { data: lowStockPg, isLoading: loadingLowStock } = useProducts({ lowStock: true, size: 1 })

  const myVentasHoy  = salesPage?.totalElements  ?? 0
  const bajosDeStock = lowStockPg?.totalElements ?? 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader name={name} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loadingSales ? <StatCardSkeleton /> : (
          <StatCard icon={ShoppingCart} label={t('Mis ventas hoy')} value={myVentasHoy}
            iconBg="bg-blue-50" iconColor="text-blue-600" />
        )}
        {loadingLowStock ? <StatCardSkeleton /> : (
          <StatCard icon={AlertTriangle} label={t('Productos bajo stock')} value={bajosDeStock}
            iconBg={bajosDeStock > 0 ? 'bg-red-50' : 'bg-emerald-50'}
            iconColor={bajosDeStock > 0 ? 'text-red-500' : 'text-emerald-500'} />
        )}
      </div>

      {/* El vendedor ve cuánto sencillo le dejaron hoy (y el cajón si puede ver el cierre) */}
      <CashFloatCard canRegister={false} canSeeDrawer={can('canViewCashClosing') || can('canViewReports')} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ActionTile primary icon={ShoppingCart} label={t('Nueva venta')} hint={t('Cobrar y descontar stock')} onClick={() => navigate('/sales/new')} />
        {can('canRegisterSale') && (
          <ActionTile icon={FileText} label={t('Nuevo presupuesto')} hint={t('Cotización en PDF o WhatsApp')} onClick={() => navigate('/cotizaciones')} />
        )}
      </div>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === 'SUPER_ADMIN') return <SuperAdminDashboard name={user.name} />
  if (user?.role === 'EMPLOYEE')    return <EmployeeDashboard   name={user.name} />
  return <OwnerDashboard name={user?.name} businessId={user?.businessId} />
}
