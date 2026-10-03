import { NavLink, Link } from 'react-router-dom'
import { BarChart2, Scale, Trophy, Award, Users, Wallet, HandCoins, Truck, Tag, FolderOpen, MapPin, Search, X, Edit, Trash2, ArrowRight } from 'lucide-react'
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
  // Solo dueño: lleva costos de compra (3-oct-2026)
  { to: '/reports/suppliers', icon: Truck,     label: 'Análisis de proveedores', hint: 'Quién te vende más', ownerOnly: true },
]

// Fila de tarjetas para saltar entre páginas hermanas (la activa en azul).
export function SiblingSwitcher({ items, label }) {
  const t = useT()
  if (items.length < 2) return null
  const cols = items.length === 3 ? 'sm:grid-cols-3' : items.length >= 5 ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-4'
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
  const { user, can } = useAuth()
  if (!can('canViewReports')) return null
  const owner = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'
  return <SiblingSwitcher items={SIBLINGS.filter((s) => !s.ownerOnly || owner)} label={t('Reportes')} />
}

// Clientes ↔ Cuentas por cobrar ↔ Cuentas por pagar: la plata que entra y sale.
export function AccountsSwitcher() {
  const t = useT()
  const { user, can } = useAuth()
  const owner = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'
  const items = [
    (owner || can('canManageCustomers')) && { to: '/customers', icon: Users, label: 'Clientes', hint: 'A quién le vendes' },
    can('canViewReports') && { to: '/reports/receivables', icon: Wallet, label: 'Cuentas x cobrar', hint: 'Lo que te deben' },
    owner && { to: '/suppliers', icon: Truck, label: 'Proveedores', hint: 'A quién le compras' },
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

// Marcas ↔ Categorías ↔ Ubicaciones: cómo se ordena el catálogo.
export function CatalogSwitcher() {
  const t = useT()
  return (
    <SiblingSwitcher label={t('Catálogo')} items={[
      { to: '/brands',     icon: Tag,        label: 'Marcas',      hint: 'De qué marca es cada producto' },
      { to: '/categories', icon: FolderOpen, label: 'Categorías',  hint: 'Cómo ordenas el catálogo' },
      { to: '/locations',  icon: MapPin,     label: 'Ubicaciones', hint: 'Dónde está cada producto' },
    ]} />
  )
}

// Buscador grande de las páginas de listas.
export function BigSearch({ value, onChange, placeholder, children }) {
  const t = useT()
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-3 pl-11 pr-10 text-base text-gray-900 outline-none transition-colors focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20" />
        {value && (
          <button type="button" onClick={() => onChange('')} title={t('Limpiar')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
            <X size={15} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

// Botón principal «Nuevo …» de la cabecera.
export function NewButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98]">
      {children}
    </button>
  )
}

/**
 * Tarjeta de un registro (proveedor, marca, categoría, ubicación): avatar,
 * nombre en dos líneas, datos, y acciones SIEMPRE visibles (regla de Frank:
 * nada escondido tras un hover). Toda la tarjeta abre `onOpen`.
 */
export function EntityCard({ avatar, title, subtitle, onOpen, onEdit, onDelete, link, actions, children }) {
  const t = useT()
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-1 cursor-pointer items-start gap-3.5 p-4 sm:p-5" onClick={onOpen}>
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words font-bold leading-snug text-gray-900">{title}</p>
          {subtitle && <div className="mt-0.5 text-xs text-gray-400">{subtitle}</div>}
          {children && <div className="mt-2.5 space-y-1.5">{children}</div>}
        </div>
        <div className="flex flex-shrink-0 gap-1">
          {onEdit && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit() }} title={t('Editar')}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
              <Edit size={15} />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete() }} title={t('Eliminar')}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
      {link && (
        <Link to={link.to} onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-2.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 sm:px-5">
          {link.label}
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
      {/* Acciones explícitas, del mismo peso (Frank, 3-oct: «que sea más obvio»): una columna por acción */}
      {actions?.length > 0 && (
        <div className={`grid border-t border-gray-100 ${actions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {actions.map(({ to, icon: Icon, label }, i) => (
            <Link key={to} to={to} onClick={(e) => e.stopPropagation()}
              className={`flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold transition-colors ${
                i === 0 ? 'text-blue-700 hover:bg-blue-50' : 'border-l border-gray-100 text-gray-700 hover:bg-gray-100'}`}>
              {Icon && <Icon size={14} />}{label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
