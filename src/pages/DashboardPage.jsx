import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Package, TrendingUp, ArrowUpDown,
  AlertTriangle, Building2, Users, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDailySummary, useReportsLowStock } from '../hooks/useReports'
import { useBusinesses } from '../hooks/useBusinesses'
import { useUsers } from '../hooks/useUsers'
import { useSales } from '../hooks/useSales'
import { useProducts } from '../hooks/useProducts'

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── shared sub-components ─────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, colorBg }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${colorBg}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-100" />
      <div className="flex-1">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        <div className="mt-2 h-6 w-14 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}

function PageHeader({ name }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">
        Bienvenido{name ? `, ${name.split(' ')[0]}` : ''}
      </h2>
      <p className="mt-0.5 text-sm capitalize text-gray-500">{todayLabel()}</p>
    </div>
  )
}

// ── SuperAdminDashboard ───────────────────────────────────────────────────────

function SuperAdminDashboard({ name }) {
  const navigate = useNavigate()

  const { data: bizPage, isLoading: loadingBiz } = useBusinesses({
    page: 0, size: 5, sort: 'createdAt,desc',
  })
  const { data: usersPage, isLoading: loadingUsers } = useUsers({ page: 0, size: 1 })

  const businesses     = bizPage?.content         ?? []
  const totalBiz       = bizPage?.totalElements   ?? 0
  const activeBiz      = businesses.filter((b) => b.active).length
  const totalUsers     = usersPage?.totalElements ?? 0
  const isLoading      = loadingBiz || loadingUsers

  return (
    <div className="flex flex-col gap-6">
      <PageHeader name={name} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Building2}    label="Total negocios"   value={totalBiz}          colorBg="bg-blue-500"   />
            <StatCard icon={CheckCircle2} label="Negocios activos" value={activeBiz}          colorBg="bg-green-500"  />
            <StatCard icon={Users}        label="Total usuarios"   value={totalUsers}         colorBg="bg-indigo-500" />
            <StatCard icon={TrendingUp}   label="Nuevos este mes"  value={businesses.length}  colorBg="bg-amber-500"  />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/admin/businesses')}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Building2 size={15} />
            Nuevo negocio
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Users size={15} />
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Recent businesses table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Negocios recientes</h3>
        </div>

        {loadingBiz ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            No hay negocios registrados aún
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">País</th>
                  <th className="px-5 py-3">Tipo ID</th>
                  <th className="px-5 py-3">Nro. ID</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                  <th className="px-5 py-3">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="max-w-[180px] truncate px-5 py-3 font-medium text-gray-900">
                      {b.name}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{b.countryCode}</td>
                    <td className="px-5 py-3 text-gray-600">{b.taxIdType}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{b.taxId}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-gray-100 px-5 py-3">
          <button
            onClick={() => navigate('/admin/businesses')}
            className="text-sm font-medium text-orange-500 hover:text-orange-600"
          >
            Ver todos los negocios →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── OwnerDashboard ────────────────────────────────────────────────────────────

const TYPE_LABEL = {
  PURCHASE_ENTRY: 'Entrada',
  SALE:           'Venta',
  ADJUSTMENT:     'Ajuste',
}
const TYPE_CLS = {
  PURCHASE_ENTRY: 'bg-green-100 text-green-700',
  SALE:           'bg-blue-100 text-blue-700',
  ADJUSTMENT:     'bg-amber-100 text-amber-700',
}

function OwnerDashboard({ name, businessId }) {
  const scopeParams = businessId ? { businessId } : {}

  const { data: summary, isLoading: loadingSummary } = useDailySummary(scopeParams)
  const { data: lowStockPage, isLoading: loadingLow } = useReportsLowStock(
    { size: 10, ...scopeParams }
  )

  const lowStock  = lowStockPage?.content ?? []
  const movements = summary?.movements    ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader name={name} />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={ShoppingCart} label="Ventas del día"      value={summary?.totalSales ?? 0}                    colorBg="bg-blue-500"   />
            <StatCard icon={Package}      label="Unidades vendidas"    value={summary?.totalItemsSold ?? 0}                colorBg="bg-indigo-500" />
            <StatCard icon={TrendingUp}   label="Ingresos del día"     value={formatCurrency(summary?.totalRevenue)}       colorBg="bg-green-500"  />
            <StatCard icon={ArrowUpDown}  label="Movimientos de stock" value={movements.length}                           colorBg="bg-amber-500"  />
          </>
        )}
      </div>

      {/* Low-stock alerts */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
          <AlertTriangle size={15} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">Alertas de stock bajo</h3>
          {!loadingLow && lowStockPage?.totalElements > 0 && (
            <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {lowStockPage.totalElements} productos
            </span>
          )}
        </div>

        {loadingLow ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : lowStock.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            Todos los productos tienen stock suficiente
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 text-center">Stock actual</th>
                  <th className="px-5 py-3 text-center">Mínimo</th>
                  <th className="px-5 py-3 text-center">Déficit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStock.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="max-w-[200px] truncate px-5 py-3 font-medium text-gray-900">
                      {item.productName}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{item.productSku}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={item.currentStock === 0 ? 'font-semibold text-red-600' : 'text-gray-700'}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-500">{item.minStock}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
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
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Movimientos de hoy</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3 text-center">Tipo</th>
                  <th className="px-5 py-3 text-center">Cantidad</th>
                  <th className="px-5 py-3">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.slice(0, 8).map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="max-w-[220px] truncate px-5 py-3 font-medium text-gray-900">
                      {m.productName}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLS[m.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABEL[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-gray-700">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="max-w-[130px] truncate px-5 py-3 text-gray-500">
                      {m.createdByName ?? '—'}
                    </td>
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

// ── EmployeeDashboard ─────────────────────────────────────────────────────────

function EmployeeDashboard({ name }) {
  const navigate  = useNavigate()
  const today     = todayStr()

  const { data: salesPage,   isLoading: loadingSales }   = useSales({ from: today, to: today })
  const { data: lowStockPg,  isLoading: loadingLowStock } = useProducts(
    { lowStock: true, size: 1 },
  )

  const myVentasHoy  = salesPage?.totalElements   ?? 0
  const bajosDeStock = lowStockPg?.totalElements  ?? 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader name={name} />

      {/* 2 KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loadingSales ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            icon={ShoppingCart}
            label="Mis ventas hoy"
            value={myVentasHoy}
            colorBg="bg-orange-500"
          />
        )}
        {loadingLowStock ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            icon={AlertTriangle}
            label="Productos bajo stock"
            value={bajosDeStock}
            colorBg={bajosDeStock > 0 ? 'bg-amber-500' : 'bg-green-500'}
          />
        )}
      </div>

      {/* Quick action */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Acciones rápidas</h3>
        <button
          onClick={() => navigate('/sales/new')}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <ShoppingCart size={15} />
          Nueva venta
        </button>
      </div>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard name={user.name} />
  }
  if (user?.role === 'EMPLOYEE') {
    return <EmployeeDashboard name={user.name} />
  }
  return <OwnerDashboard name={user?.name} businessId={user?.businessId} />
}
