import { AlertTriangle } from 'lucide-react'
import { useT } from '../../i18n'

/**
 * Fichas de CLIENTE y PROVEEDOR (rediseño 29-sep, Frank): franja azul de perfil
 * con la deuda en grande + columna de acciones. Así se ven igual que el resto
 * de la app (Dashboard, Productos, Cuentas…).
 */

function initialsOf(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

// Franja de perfil: avatar + nombre + datos de contacto, y a la derecha la
// deuda con la barra del límite.
export function ProfileHero({ name, chips = [], debtLabel, debt, limitLabel, limit, usage, exceeds, exceedsLabel, notes }) {
  const t = useT()
  const pct = usage != null ? Math.max(3, Math.min(100, usage)) : null
  return (
    <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-5 text-white shadow-md shadow-blue-600/30 sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-40 h-40 w-40 rounded-full bg-white/5" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold ring-1 ring-white/30">
            {initialsOf(name)}
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">{name}</h2>
            {chips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chips.map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
                    <Icon size={12} className="flex-shrink-0" /> <span className="truncate">{text}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 lg:min-w-[17rem]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">{debtLabel}</p>
            {exceeds && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold">
                <AlertTriangle size={11} /> {exceedsLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">{debt}</p>
          {pct != null ? (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div className={`h-full rounded-full ${exceeds ? 'bg-red-400' : 'bg-white'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-white/80">{t('{pct}% de {limit}', { pct: usage, limit })} · {limitLabel}</p>
            </>
          ) : (
            <p className="mt-1 text-xs text-white/70">{limitLabel}: —</p>
          )}
        </div>
      </div>
      {notes && <p className="relative mt-4 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/90">{notes}</p>}
    </div>
  )
}

// Botón de acción de la columna derecha (grande, con ícono y para qué sirve).
export function ActionButton({ icon: Icon, label, hint, onClick, tone = 'default', disabled, href }) {
  const tones = {
    primary: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700',
    blue:    'bg-blue-600 text-white shadow-md shadow-blue-600/25 hover:bg-blue-700',
    default: 'border border-gray-100 bg-white text-gray-900 shadow-sm hover:border-blue-200 hover:shadow-md',
  }
  const iconTones = {
    primary: 'bg-white/20 text-white',
    blue:    'bg-white/20 text-white',
    default: 'bg-blue-50 text-blue-600',
  }
  const cls = `flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]}`
  const body = (
    <>
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconTones[tone]}`}><Icon size={18} /></span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className={`block truncate text-xs ${tone === 'default' ? 'text-gray-400' : 'text-white/80'}`}>{hint}</span>}
      </span>
    </>
  )
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
    : <button type="button" onClick={onClick} disabled={disabled} className={cls}>{body}</button>
}

// Dato pequeño de la tarjeta «Cuenta».
export function InfoRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-bold ${tone ?? 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

// Cabecera de sección con ícono, título, contador y acción.
export function SectionTitle({ icon: Icon, title, count, right, hint, className = 'mb-4' }) {
  return (
    <div className={`${className} flex flex-wrap items-center justify-between gap-2`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={15} /></span>}
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            {title}
            {count != null && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">{count}</span>}
          </h3>
          {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}
