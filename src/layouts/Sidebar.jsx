import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Plus,
  ArrowUpDown, BarChart2, Users, Building2,
  LogOut, Truck, Tag, FolderOpen, X, Settings, Bell,
  Wallet, HandCoins, FileText, Trophy, Scale, Crown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'

const BOSS_ITEM = { icon: Crown, label: 'Panel Boss', path: '/boss' }

const SUPER_ADMIN_NAV = [
  { icon: Building2, label: 'Negocios', path: '/admin/businesses' },
  { icon: Users,     label: 'Owners',   path: '/admin/owners' },
  { icon: Settings,  label: 'Ajustes',  path: '/settings' },
]

const OWNER_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',         path: '/dashboard',           permission: null },
  { icon: Package,         label: 'Productos',         path: '/products',            permission: null },
  { icon: ArrowUpDown,     label: 'Stock',             path: '/stock',               permission: null },
  { icon: ShoppingCart,    label: 'Ventas',            path: '/sales',               permission: null },
  { icon: Plus,            label: 'Nueva Venta',       path: '/sales/new',           permission: 'canRegisterSale' },
  { icon: FileText,        label: 'Cotización',        path: '/cotizaciones',        permission: 'canRegisterSale' },
  { icon: BarChart2,       label: 'Reportes',          path: '/reports',             permission: 'canViewReports' },
  { icon: Scale,           label: 'Balance',           path: '/reports/balance',     permission: 'canViewReports' },
  { icon: Trophy,          label: 'Vendedores',        path: '/reports/sellers',     permission: 'canViewReports' },
  { icon: Users,           label: 'Clientes',          path: '/customers',           permission: null },
  { icon: Wallet,          label: 'Cuentas x cobrar',  path: '/reports/receivables', permission: 'canViewReports' },
  { icon: HandCoins,       label: 'Cuentas x pagar',   path: '/reports/payables',    permission: null },
  { icon: Truck,           label: 'Proveedores',       path: '/suppliers',           permission: null },
  { icon: Tag,             label: 'Marcas',            path: '/brands',              permission: null },
  { icon: FolderOpen,      label: 'Categorías',        path: '/categories',          permission: null },
  { icon: Users,           label: 'Empleados',         path: '/empleados',           permission: null },
  { icon: Bell,            label: 'Notificaciones',    path: '/notificaciones',      permission: null },
  { icon: Settings,        label: 'Ajustes',           path: '/settings',            permission: null },
]

const EMPLOYEE_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',         path: '/dashboard',           permission: null },
  { icon: Package,         label: 'Productos',         path: '/products',            permission: null },
  { icon: ArrowUpDown,     label: 'Stock',             path: '/stock',               permission: null },
  { icon: ShoppingCart,    label: 'Ventas',            path: '/sales',               permission: null },
  { icon: Plus,            label: 'Nueva Venta',       path: '/sales/new',           permission: 'canRegisterSale' },
  { icon: FileText,        label: 'Cotización',        path: '/cotizaciones',        permission: 'canRegisterSale' },
  { icon: BarChart2,       label: 'Reportes',          path: '/reports',             permission: 'canViewReports' },
  { icon: Scale,           label: 'Balance',           path: '/reports/balance',     permission: 'canViewReports' },
  // Vendedor sin reportes completos: solo el cierre de caja del día (sin ganancias).
  { icon: Scale,           label: 'Cierre de caja',    path: '/reports/balance',     permission: 'canViewCashClosing', hideIfPermission: 'canViewReports' },
  { icon: Users,           label: 'Clientes',          path: '/customers',           permission: 'canManageCustomers' },
  { icon: Wallet,          label: 'Cuentas x cobrar',  path: '/reports/receivables', permission: 'canViewReports' },
  { icon: Bell,            label: 'Notificaciones',    path: '/notificaciones',      permission: null },
  { icon: Settings,        label: 'Ajustes',           path: '/settings',            permission: null },
]

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  EMPLOYEE: 'Employee',
}

function navItemsForRole(role) {
  if (role === 'SUPER_ADMIN') return SUPER_ADMIN_NAV
  if (role === 'OWNER')       return OWNER_NAV
  if (role === 'EMPLOYEE')    return EMPLOYEE_NAV
  return []
}

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user, can, logout } = useAuth()
  const { pathname }          = useLocation()
  const t                     = useT()

  useEffect(() => {
    onClose()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const baseItems = user?.isBoss
    ? [BOSS_ITEM, ...SUPER_ADMIN_NAV]
    : navItemsForRole(user?.role)

  const items = baseItems.filter(
    (item) => (!item.permission || can(item.permission))
      && (!item.hideIfPermission || !can(item.hideIfPermission)),
  )

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — design v2 Cupertino: vibrancy claro estilo macOS, tinta
          oscura, ítem activo en system blue. Colores con utilities estándar
          para que los mapeos de dark mode de index.css sigan aplicando. */}
      <aside
        className={`
          ez-sidebar fixed inset-y-0 left-0 z-30 flex h-screen w-64 flex-shrink-0 flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          aria-label={t('Cerrar menú')}
          className="absolute right-3 top-3 rounded-xl p-1.5 text-gray-400 hover:bg-gray-200/70 hover:text-gray-700 md:hidden transition-colors"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <img src="/logo.png" alt="Eazy Stock" className="h-10 w-10 rounded-xl object-contain shadow-sm" />
          <span className="text-[17px] font-bold tracking-tight text-gray-900">Eazy Stock</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-1">
          <ul className="space-y-0.5">
            {items.map(({ icon: Icon, label, path }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 font-semibold text-white'
                        : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {t(label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
              <span className="text-xs text-gray-500">
                {user?.isBoss ? '👑 Boss' : t(ROLE_LABEL[user?.role] ?? user?.role)}
              </span>
            </div>
            <button
              onClick={logout}
              title={t('Cerrar sesión')}
              className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-red-500"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
