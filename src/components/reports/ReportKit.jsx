import { NavLink } from 'react-router-dom'
import { BarChart2, Scale, Trophy, Award, Users, Wallet, HandCoins } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'

/**
 * Piezas comunes de las páginas de REPORTES (rediseño 29-sep, Frank:
 * «vamos a revolucionar»): mismo lenguaje que Dashboard, Productos, Stock y
 * Ventas — franja azul con la cifra que importa + accesos entre las páginas
 * hermanas, que están relacionadas (Reportes, Balance, Vendedores, Clientes).
 */

const SIBLINGS = [
  { to: '/reports',           icon: BarChart2, label: 'Reportes',            hint: 'Ventas, productos y stock' },
  { to: '/reports/balance',   icon: Scale,     label: 'Balance',             hint: 'Ganancia y cierre de caja' },
  { to: '/reports/sellers',   icon: Trophy,    label: 'Vendedores',          hint: 'Quién vendió más' },
  { to: '/reports/customers', icon: Award,     label: 'Análisis de clientes', hint: 'Quién te compra más' },
]

// Fila de tarjetas para saltar entre páginas hermanas (la activa en azul).
export function SiblingSwitcher({ items, label }) {
  const t = useT()
  if (items.length < 2) return null
  const cols = items.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'
  return (
    <nav className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid ${cols} sm:overflow-visible sm:px-0 sm:pb-0`} aria-label={label}>
      {items.map(({ to, icon: Icon, label: itemLabel, hint }) => (
        <NavLink key={to} to={to} end
          className={({ isActive }) => `group flex min-w-[10.5rem] flex-shrink-0 items-center gap-3 rounded-2xl p-3 transition-all sm:min-w-0 ${
            isActive
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'border border-gray-100 bg-white text-gray-900 shadow-sm hover:border-blue-200 hover:shadow-md'
          }`}>
          {({ isActive }) => (
            <>
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{t(itemLabel)}</span>
                <span className={`block truncate text-[11px] ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{t(hint)}</span>
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

// Las cuatro páginas de reportes, a un toque desde cualquiera de ellas.
export function ReportsSwitcher() {
  const t = useT()
  const { can } = useAuth()
  if (!can('canViewReports')) return null
  return <SiblingSwitcher items={SIBLINGS} label={t('Reportes')} />
}

// Clientes ↔ Cuentas por cobrar ↔ Cuentas por pagar: la plata que entra y sale.
export function AccountsSwitcher() {
  const t = useT()
  const { user, can } = useAuth()
  const owner = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'
  const items = [
    (owner || can('canManageCustomers')) && { to: '/customers', icon: Users, label: 'Clientes', hint: 'A quién le vendes' },
    can('canViewReports') && { to: '/reports/receivables', icon: Wallet, label: 'Cuentas x cobrar', hint: 'Lo que te deben' },
    owner && { to: '/reports/payables', icon: HandCoins, label: 'Cuentas x pagar', hint: 'Lo que debes a proveedores' },
  ].filter(Boolean)
  return <SiblingSwitcher items={items} label={t('Cuentas')} />
}

// Franja azul con la cifra principal del reporte y hasta 4 cifras de apoyo.
export function ReportHero({ label, value, sub, cells = [], icon: Icon, loading, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-5 text-white shadow-md shadow-blue-600/30 sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />
      {Icon && <Icon className="pointer-events-none absolute right-5 top-5 h-10 w-10 text-white/25 sm:h-12 sm:w-12" />}
      <p className="relative text-xs font-semibold uppercase tracking-widest text-white/80">{label}</p>
      {loading ? (
        <div className="relative mt-2 h-10 w-40 animate-pulse rounded-lg bg-white/20" />
      ) : (
        <p className="relative mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{value}</p>
      )}
      {sub && <div className="relative mt-2 text-xs text-white/80">{sub}</div>}
      {cells.length > 0 && (
        <div className={`relative mt-5 grid gap-2 border-t border-white/20 pt-4 ${
          cells.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : cells.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {cells.map(([cLabel, cValue, cTone]) => (
            <div key={cLabel} className="min-w-0">
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/70">{cLabel}</p>
              <p className={`truncate text-lg font-bold ${cTone ?? ''}`}>{loading ? '—' : cValue}</p>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

// Cabecera común de las páginas de reportes: ícono azul + título + subtítulo.
export function ReportHeader({ icon: Icon, title, subtitle, help, right }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
          <Icon size={21} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-tight text-gray-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 sm:text-sm">{subtitle}</p>}
        </div>
        {help}
      </div>
      {right}
    </div>
  )
}
