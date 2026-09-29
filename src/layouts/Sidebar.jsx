import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Plus,
  ArrowUpDown, BarChart2, Users, Building2,
  LogOut, Truck, Tag, FolderOpen, X, Settings, Bell, ChevronDown,
  Wallet, HandCoins, FileText, Trophy, Scale, Crown, Award, MapPin,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'

const BOSS_ITEM = { icon: Crown, label: 'Panel Boss', path: '/boss' }

const SUPER_ADMIN_NAV = [
  { icon: Building2, label: 'Negocios', path: '/admin/businesses' },
  { icon: Users,     label: 'Owners',   path: '/admin/owners' },
  { icon: Settings,  label: 'Ajustes',  path: '/settings' },
]

// Páginas hermanas agrupadas bajo una flecha (Frank, 29-sep): Ventas con Nueva
// venta y Cotización; Reportes con Balance, Vendedores y Análisis de clientes.
// El grupo se abre solo cuando estás en una de sus páginas.
const OWNER_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',         path: '/dashboard',           permission: null },
  { icon: Package,         label: 'Productos',         path: '/products',            permission: null },
  { icon: ArrowUpDown,     label: 'Stock',             path: '/stock',               permission: null },
  { icon: ShoppingCart,    label: 'Ventas', group: 'sales', children: [
    { icon: ShoppingCart,  label: 'Historial de ventas', path: '/sales',             permission: null },
    { icon: Plus,          label: 'Nueva Venta',       path: '/sales/new',           permission: 'canRegisterSale' },
    { icon: FileText,      label: 'Cotización',        path: '/cotizaciones',        permission: 'canRegisterSale' },
  ] },
  { icon: BarChart2,       label: 'Reportes', group: 'reports', children: [
    { icon: BarChart2,     label: 'Reportes',          path: '/reports',             permission: 'canViewReports' },
    { icon: Scale,         label: 'Balance',           path: '/reports/balance',     permission: 'canViewReports' },
    { icon: Trophy,        label: 'Vendedores',        path: '/reports/sellers',     permission: 'canViewReports' },
    { icon: Award,         label: 'Análisis de clientes', path: '/reports/customers',   permission: 'canViewReports' },
  ] },
  { icon: Users,           label: 'Clientes',          path: '/customers',           permission: null },
  { icon: Wallet,          label: 'Cuentas x cobrar',  path: '/reports/receivables', permission: 'canViewReports' },
  { icon: HandCoins,       label: 'Cuentas x pagar',   path: '/reports/payables',    permission: null },
  { icon: Truck,           label: 'Proveedores',       path: '/suppliers',           permission: null },
  { icon: Tag,             label: 'Marcas',            path: '/brands',              permission: null },
  { icon: FolderOpen,      label: 'Categorías',        path: '/categories',          permission: null },
  { icon: MapPin,          label: 'Ubicaciones',       path: '/locations',           permission: null },
  { icon: Users,           label: 'Empleados',         path: '/empleados',           permission: null },
  { icon: Bell,            label: 'Notificaciones',    path: '/notificaciones',      permission: null },
  { icon: Settings,        label: 'Ajustes',           path: '/settings',            permission: null },
]

const EMPLOYEE_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',         path: '/dashboard',           permission: null },
  { icon: Package,         label: 'Productos',         path: '/products',            permission: null },
  { icon: ArrowUpDown,     label: 'Stock',             path: '/stock',               permission: null },
  { icon: ShoppingCart,    label: 'Ventas', group: 'sales', children: [
    { icon: ShoppingCart,  label: 'Historial de ventas', path: '/sales',             permission: null },
    { icon: Plus,          label: 'Nueva Venta',       path: '/sales/new',           permission: 'canRegisterSale' },
    { icon: FileText,      label: 'Cotización',        path: '/cotizaciones',        permission: 'canRegisterSale' },
  ] },
  { icon: BarChart2,       label: 'Reportes', group: 'reports', children: [
    { icon: BarChart2,     label: 'Reportes',          path: '/reports',             permission: 'canViewReports' },
    { icon: Scale,         label: 'Balance',           path: '/reports/balance',     permission: 'canViewReports' },
    // Vendedor sin reportes completos: solo el cierre de caja del día (sin ganancias).
    { icon: Scale,         label: 'Cierre de caja',    path: '/reports/balance',     permission: 'canViewCashClosing', hideIfPermission: 'canViewReports' },
    { icon: Award,         label: 'Análisis de clientes', path: '/reports/customers',   permission: 'canViewReports' },
  ] },
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

  const allowed = (item) => (!item.permission || can(item.permission))
    && (!item.hideIfPermission || !can(item.hideIfPermission))
  // Un grupo con un solo hijo visible se muestra como enlace normal.
  const items = baseItems.flatMap((item) => {
    if (!item.children) return allowed(item) ? [item] : []
    const kids = item.children.filter(allowed)
    if (kids.length === 0) return []
    if (kids.length === 1) return [{ ...kids[0], label: kids[0].path === '/sales' ? 'Ventas' : kids[0].label }]
    return [{ ...item, children: kids }]
  })

  // Grupos abiertos: el de la página actual siempre; los demás, como los dejó.
  const inGroup = (item) => item.children?.some((c) => pathname === c.path || pathname.startsWith(c.path + '/'))
  const [openGroups, setOpenGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eazystock_nav_groups') || '{}') } catch { return {} }
  })
  const toggleGroup = (key, current) => setOpenGroups((g) => {
    const next = { ...g, [key]: !current }
    try { localStorage.setItem('eazystock_nav_groups', JSON.stringify(next)) } catch { /* sin storage */ }
    return next
  })

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
            {items.map((item) => {
              if (!item.children) {
                const { icon: Icon, label, path } = item
                return (
                  <li key={path}>
                    <NavLink
                      to={path}
                      end={path === '/reports'}
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
                )
              }
              const { icon: Icon, label, group, children } = item
              const here = inGroup(item)
              const open = here || !!openGroups[group]
              return (
                <li key={group}>
                  <button type="button" onClick={() => toggleGroup(group, open)} aria-expanded={open}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all ${
                      here
                        ? 'bg-blue-50 font-semibold text-blue-700'
                        : 'font-medium text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                    }`}>
                    <Icon size={16} strokeWidth={1.8} />
                    <span className="flex-1 text-left">{t(label)}</span>
                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${here ? 'bg-blue-100 text-blue-700' : 'bg-gray-200/80 text-gray-500'}`}>
                      {children.length}
                    </span>
                    <ChevronDown size={15} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <ul className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-gray-200 pl-2">
                      {children.map(({ icon: CIcon, label: cLabel, path }) => (
                        <li key={path + cLabel}>
                          <NavLink
                            to={path}
                            end={path === '/sales' || path === '/reports'}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-all ${
                                isActive
                                  ? 'bg-blue-600 font-semibold text-white'
                                  : 'font-medium text-gray-500 hover:bg-gray-200/70 hover:text-gray-900'
                              }`
                            }
                          >
                            <CIcon size={14} strokeWidth={1.8} />
                            {t(cLabel)}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
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
