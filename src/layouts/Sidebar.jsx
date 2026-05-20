import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Plus,
  ArrowUpDown, BarChart2, Users, Building2,
  LogOut, Truck, Tag,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/**
 * Nav items per role.
 * - roles: null  → visible to ALL authenticated roles
 * - roles: [...]  → visible only to those roles
 * - permission: string → additionally requires can(permission) (OWNER/SUPER_ADMIN always pass)
 */
const SUPER_ADMIN_NAV = [
  { icon: Building2, label: 'Negocios', path: '/admin/businesses' },
  { icon: Users,     label: 'Owners',   path: '/admin/owners' },
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
]

const EMPLOYEE_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/dashboard',  permission: null },
  { icon: Package,         label: 'Productos',   path: '/products',   permission: null },
  { icon: ArrowUpDown,     label: 'Stock',        path: '/stock',      permission: null },
  { icon: ShoppingCart,    label: 'Ventas',       path: '/sales',      permission: null },
  { icon: Plus,            label: 'Nueva Venta', path: '/sales/new',  permission: 'canRegisterSale' },
  { icon: BarChart2,       label: 'Reportes',     path: '/reports',    permission: 'canViewReports' },
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

export default function Sidebar() {
  const { user, can, logout } = useAuth()

  const items = navItemsForRole(user?.role).filter(
    (item) => !item.permission || can(item.permission),
  )

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-[#0f172a]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
          <Package size={16} className="text-white" />
        </div>
        <span className="text-lg font-semibold text-white">Eazy Stock</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {items.map(({ icon: Icon, label, path }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-700 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <span className="text-xs text-slate-400">{ROLE_LABEL[user?.role] ?? user?.role}</span>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="flex-shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
