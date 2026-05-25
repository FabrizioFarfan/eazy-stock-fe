import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Plus,
  ArrowUpDown, BarChart2, Users, Building2,
  LogOut, Truck, Tag, X, Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const SUPER_ADMIN_NAV = [
  { icon: Building2, label: 'Negocios', path: '/admin/businesses' },
  { icon: Users,     label: 'Owners',   path: '/admin/owners' },
  { icon: Settings,  label: 'Ajustes',  path: '/settings' },
]

const OWNER_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/dashboard',  permission: null },
  { icon: Package,         label: 'Productos',   path: '/products',   permission: null },
  { icon: ArrowUpDown,     label: 'Stock',        path: '/stock',      permission: null },
  { icon: ShoppingCart,    label: 'Ventas',       path: '/sales',      permission: null },
  { icon: Plus,            label: 'Nueva Venta', path: '/sales/new',  permission: 'canRegisterSale' },
  { icon: BarChart2,       label: 'Reportes',     path: '/reports',    permission: 'canViewReports' },
  { icon: Truck,           label: 'Proveedores',  path: '/suppliers',  permission: null },
  { icon: Tag,             label: 'Marcas',       path: '/brands',     permission: null },
  { icon: Users,           label: 'Empleados',    path: '/empleados',  permission: null },
  { icon: Settings,        label: 'Ajustes',      path: '/settings',   permission: null },
]

const EMPLOYEE_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/dashboard',  permission: null },
  { icon: Package,         label: 'Productos',   path: '/products',   permission: null },
  { icon: ArrowUpDown,     label: 'Stock',        path: '/stock',      permission: null },
  { icon: ShoppingCart,    label: 'Ventas',       path: '/sales',      permission: null },
  { icon: Plus,            label: 'Nueva Venta', path: '/sales/new',  permission: 'canRegisterSale' },
  { icon: BarChart2,       label: 'Reportes',     path: '/reports',    permission: 'canViewReports' },
  { icon: Settings,        label: 'Ajustes',      path: '/settings',   permission: null },
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

  useEffect(() => {
    onClose()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const items = navItemsForRole(user?.role).filter(
    (item) => !item.permission || can(item.permission),
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

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex h-screen w-64 flex-shrink-0 flex-col bg-[#111827]
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden transition-colors"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <img src="/logo.png" alt="Eazy Stock" className="h-11 w-11 rounded-xl object-contain" />
          <span className="text-lg font-bold text-white">Eazy Stock</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-0.5">
            {items.map(({ icon: Icon, label, path }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/40'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-700/60 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <span className="text-xs text-slate-400">{ROLE_LABEL[user?.role] ?? user?.role}</span>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
