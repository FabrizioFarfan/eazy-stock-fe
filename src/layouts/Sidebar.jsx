import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Plus,
  ArrowUpDown, BarChart2, Users, Building2,
  LogOut, Truck, Tag,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  // All roles
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/dashboard',        roles: null },

  // OWNER + EMPLOYEE only
  { icon: Package,         label: 'Productos',   path: '/products',         roles: ['OWNER', 'EMPLOYEE'] },
  { icon: ShoppingCart,    label: 'Ventas',       path: '/sales',            roles: ['OWNER', 'EMPLOYEE'] },
  { icon: Plus,            label: 'Nueva Venta', path: '/sales/new',        roles: ['OWNER', 'EMPLOYEE'] },
  { icon: ArrowUpDown,     label: 'Stock',        path: '/stock',            roles: ['OWNER', 'EMPLOYEE'] },
  { icon: BarChart2,       label: 'Reportes',     path: '/reports',          roles: ['OWNER'] },
  { icon: Truck,           label: 'Proveedores',  path: '/suppliers',        roles: ['OWNER'] },
  { icon: Tag,             label: 'Marcas',       path: '/brands',           roles: ['OWNER'] },
  { icon: Users,           label: 'Usuarios',     path: '/settings/users',   roles: ['OWNER'] },

  // SUPER_ADMIN only
  { icon: Building2,       label: 'Negocios',     path: '/admin/businesses', roles: ['SUPER_ADMIN'] },
  { icon: Users,           label: 'Usuarios',     path: '/admin/users',      roles: ['SUPER_ADMIN'] },
]

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  EMPLOYEE: 'Employee',
}

export default function Sidebar() {
  const { user, logout } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
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
          {visibleItems.map(({ icon: Icon, label, path }) => (
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
