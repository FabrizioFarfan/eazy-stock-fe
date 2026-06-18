import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Package, TrendingUp, ArrowUpDown,
  AlertTriangle, Building2, Users, CheckCircle2,
  FileText, Trophy, ArrowRight, Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDailySummary, useReportsLowStock } from '../hooks/useReports'
import { useBusinesses } from '../hooks/useBusinesses'
import { useUsers } from '../hooks/useUsers'
import { useSales } from '../hooks/useSales'
import { useProducts } from '../hooks/useProducts'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function todayLabel() {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
}

function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
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
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">
        Bienvenido{name ? `, ${name.split(' ')[0]}` : ''} 👋
      </h2>
      <p className="mt-1 text-sm capitalize text-gray-400">{todayLabel()}</p>
    </div>
  )
}

// ── Super Admin ───────────────────────────────────────────────────────────────

function SuperAdminDashboard({ name }) {
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
            <StatCard icon={Building2}    label="Total negocios"   value={totalBiz}         iconBg="bg-blue-50"   iconColor="text-blue-500" />
            <StatCard icon={CheckCircle2} label="Negocios activos" value={activeBiz}         iconBg="bg-emerald-50" iconColor="text-emerald-500" />
            <StatCard icon={Users}        label="Total usuarios"   value={totalUsers}        iconBg="bg-indigo-50" iconColor="text-indigo-500" />
            <StatCard icon={TrendingUp}   label="Nuevos este mes"  value={businesses.length} iconBg="bg-amber-50"  iconColor="text-amber-500" />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/admin/businesses')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            <Building2 size={15} />
            Nuevo negocio
          </button>
          <button
            onClick={() => navigate('/admin/owners')}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Users size={15} />
            Nuevo owner
          </button>
        </div>
      </div>

      {/* Recent businesses */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Negocios recientes</h3>
        </div>
        {loadingBiz ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No hay negocios registrados aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60 text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Nombre</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">País</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">RUC</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 text-center">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Registrado</th>
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
                        {b.active ? 'Activo' : 'Inactivo'}
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
            Ver todos los negocios →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Owner ─────────────────────────────────────────────────────────────────────

const TYPE_LABEL = { PURCHASE_ENTRY: 'Entrada', SALE: 'Venta', ADJUSTMENT: 'Ajuste' }
const TYPE_CLS   = {
  PURCHASE_ENTRY: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  SALE:           'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  ADJUSTMENT:     'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
}

function OwnerDashboard({ name, businessId }) {
  const navigate    = useNavigate()
  const scopeParams = businessId ? { businessId } : {}

  const { data: summary,      isLoading: loadingSummary } = useDailySummary(scopeParams)
  const { data: lowStockPage, isLoading: loadingLow }     = useReportsLowStock({ size: 10, ...scopeParams })

  const lowStock  = lowStockPage?.content ?? []
  const movements = summary?.movements    ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader name={name} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={ShoppingCart} label="Ventas del día"      value={summary?.totalSales ?? 0}                   iconBg="bg-blue-50"   iconColor="text-blue-500" />
            <StatCard icon={Package}      label="Unidades vendidas"   value={summary?.totalItemsSold ?? 0}               iconBg="bg-indigo-50" iconColor="text-indigo-500" />
            <StatCard icon={TrendingUp}   label="Ingresos del día"    value={formatCurrency(summary?.totalRevenue)}      iconBg="bg-emerald-50" iconColor="text-emerald-500" />
            <StatCard icon={ArrowUpDown}  label="Movimientos de hoy"  value={movements.length}                           iconBg="bg-amber-50"  iconColor="text-amber-500" />
          </>
        )}
      </div>

      {/* Presupuestos — feature destacada */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <FileText size={22} />
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                <Sparkles size={10} /> Nuevo
              </div>
              <h3 className="text-base font-bold text-gray-900">Crea presupuestos para tus clientes</h3>
              <p className="mt-0.5 text-sm text-gray-500">
                Arma una cotización en segundos y expórtala en PDF para enviarla por WhatsApp o correo.
                No descuenta stock ni registra una venta.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/cotizaciones')}
            className="group flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <FileText size={15} />
            Crear presupuesto
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/sales/new')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <ShoppingCart size={15} />
            Nueva venta
          </button>
          <button
            onClick={() => navigate('/cotizaciones')}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FileText size={15} />
            Nuevo presupuesto
          </button>
          <button
            onClick={() => navigate('/reports/sellers')}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Trophy size={15} />
            Rendimiento de vendedores
          </button>
        </div>
      </div>

      {/* Low-stock alerts */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Alertas de stock bajo</h3>
          {!loadingLow && lowStockPage?.totalElements > 0 && (
            <span className="ml-auto rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-100">
              {lowStockPage.totalElements} productos
            </span>
          )}
        </div>

        {loadingLow ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : lowStock.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-500">Todo el stock está en orden</p>
            <p className="text-xs text-gray-400">Ningún producto está por debajo del mínimo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Código</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Stock</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Mínimo</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Déficit</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.productId} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="max-w-[200px] truncate px-6 py-3.5 font-medium text-gray-900">{item.productName}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-400">{item.productSku}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={item.currentStock === 0 ? 'font-bold text-red-600' : 'font-medium text-gray-700'}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-500">{item.minStock}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-100">
                        -{item.deficit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent movements */}
      {movements.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Movimientos de hoy</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Producto</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Tipo</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.slice(0, 8).map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="max-w-[220px] truncate px-6 py-3.5 font-medium text-gray-900">{m.productName}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_CLS[m.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABEL[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-semibold text-gray-800">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="max-w-[130px] truncate px-6 py-3.5 text-gray-400">{m.createdByName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Employee ──────────────────────────────────────────────────────────────────

function EmployeeDashboard({ name }) {
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
          <StatCard icon={ShoppingCart} label="Mis ventas hoy" value={myVentasHoy}
            iconBg="bg-blue-50" iconColor="text-blue-600" />
        )}
        {loadingLowStock ? <StatCardSkeleton /> : (
          <StatCard icon={AlertTriangle} label="Productos bajo stock" value={bajosDeStock}
            iconBg={bajosDeStock > 0 ? 'bg-red-50' : 'bg-emerald-50'}
            iconColor={bajosDeStock > 0 ? 'text-red-500' : 'text-emerald-500'} />
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/sales/new')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            <ShoppingCart size={15} />
            Nueva venta
          </button>
          {can('canRegisterSale') && (
            <button
              onClick={() => navigate('/cotizaciones')}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <FileText size={15} />
              Nuevo presupuesto
            </button>
          )}
        </div>
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
