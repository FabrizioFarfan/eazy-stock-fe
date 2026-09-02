import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import LangSwitcher from '../i18n/LangSwitcher'
import { useT } from '../i18n'

const PAGE_TITLES = {
  '/dashboard':          'Dashboard',
  '/products':           'Productos',
  '/sales':              'Ventas',
  '/sales/new':          'Nueva Venta',
  '/stock':              'Stock',
  '/reports':            'Reportes',
  '/reports/sellers':    'Vendedores',
  '/reports/customers':  'Análisis de clientes',
  '/customers':          'Clientes',
  '/settings/users':     'Usuarios',
  '/empleados':          'Empleados',
  '/suppliers':          'Proveedores',
  '/brands':             'Marcas',
  '/admin/businesses':   'Negocios',
  '/admin/owners':       'Owners',
  '/notificaciones':     'Notificaciones',
  '/settings':           'Ajustes',
}

const ROLE_BADGE = {
  SUPER_ADMIN: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  OWNER:       'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
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
  const t            = useT()

  const title      = PAGE_TITLES[pathname] ? t(PAGE_TITLES[pathname]) : 'Eazy Stock'
  const badgeClass = ROLE_BADGE[user?.role] ?? 'bg-gray-100 text-gray-600'
  const showBell   = user?.role === 'OWNER' || user?.role === 'EMPLOYEE'

  return (
    <header className="ez-topbar flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-1.5 text-gray-500 hover:bg-gray-100 md:hidden transition-colors"
          aria-label={t('Abrir menú')}
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {user?.businessName && (
          <span className="hidden text-sm font-medium text-gray-400 sm:block">{user.businessName}</span>
        )}
        {user?.role && (
          <span className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-block ${badgeClass}`}>
            {t(ROLE_LABEL[user.role] ?? user.role)}
          </span>
        )}
        <LangSwitcher compact />
        {showBell && <NotificationBell />}
      </div>
    </header>
  )
}
