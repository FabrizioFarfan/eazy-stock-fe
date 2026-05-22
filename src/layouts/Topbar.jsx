import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PAGE_TITLES = {
  '/dashboard':          'Dashboard',
  '/products':           'Productos',
  '/sales':              'Ventas',
  '/sales/new':          'Nueva Venta',
  '/stock':              'Stock',
  '/reports':            'Reportes',
  '/settings/users':     'Usuarios',
  '/empleados':          'Empleados',
  '/suppliers':          'Proveedores',
  '/brands':             'Marcas',
  '/admin/businesses':   'Negocios',
  '/admin/owners':       'Owners',
  '/settings':           'Ajustes',
}

const ROLE_BADGE = {
  SUPER_ADMIN: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  OWNER:       'bg-orange-50 text-orange-700 ring-1 ring-orange-100',
  EMPLOYEE:    'bg-slate-100 text-slate-600',
}

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  OWNER:       'Owner',
  EMPLOYEE:    'Employee',
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { user }     = useAuth()

  const title      = PAGE_TITLES[pathname] ?? 'Eazy Stock'
  const badgeClass = ROLE_BADGE[user?.role] ?? 'bg-gray-100 text-gray-600'

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-1.5 text-gray-500 hover:bg-gray-100 md:hidden transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {user?.businessName && (
          <span className="hidden text-sm font-medium text-gray-400 sm:block">{user.businessName}</span>
        )}
        {user?.role && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
        )}
      </div>
    </header>
  )
}
