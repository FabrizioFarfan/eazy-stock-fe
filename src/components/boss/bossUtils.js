import { dateLocale } from '../../i18n'

// Helpers del lado Boss / admin (sin componentes, para que Fast Refresh no se queje).

// Bandera a partir del código de país (PE → 🇵🇪); 🌐 si no hay código.
export const flagEmoji = (cc) =>
  cc && cc.length === 2
    ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
    : '🌐'

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

const AVATAR_COLORS = ['bg-blue-600', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-teal-500']
export function avatarColor(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

export function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}

export const isThisMonth = (iso) => {
  if (!iso) return false
  const d = new Date(iso), n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
}
