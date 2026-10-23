import { Bell, ShoppingCart, Package, CheckCircle, RotateCcw, TrendingDown, CalendarClock } from 'lucide-react'
import { useT, dateLocale } from '../../i18n'

/** «Hace 5 min» / «Hace 3h» / «12 ago» — la campana y la página lo muestran igual. */
function formatRelativeTime(dateStr, t) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)   return t('Ahora mismo')
  if (mins < 60)  return t('Hace {n} min', { n: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('Hace {n}h', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 7)   return t('Hace {n}d', { n: days })
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short' }).format(new Date(dateStr))
}

// Los tipos los emiten SaleService (NEW_SALE, SALE_CONFIRMED), SaleReturnService
// (SALE_RETURN), StockMovementService (STOCK_UPDATE), LowStockAlerts (LOW_STOCK,
// 23-oct: un movimiento deja el producto bajo su mínimo) y ExpiryAlerts (EXPIRING,
// 9:00 del negocio: vence hoy, mañana o en 7 días).
const TYPE_CONFIG = {
  NEW_SALE:       { Icon: ShoppingCart,  color: 'text-blue-600',   iconBg: 'bg-blue-100' },
  SALE_CONFIRMED: { Icon: CheckCircle,   color: 'text-green-600',  iconBg: 'bg-green-100' },
  SALE_RETURN:    { Icon: RotateCcw,     color: 'text-orange-600', iconBg: 'bg-orange-100' },
  STOCK_UPDATE:   { Icon: Package,       color: 'text-amber-600',  iconBg: 'bg-amber-100' },
  LOW_STOCK:      { Icon: TrendingDown,  color: 'text-red-600',    iconBg: 'bg-red-100',    label: 'Stock bajo' },
  EXPIRING:       { Icon: CalendarClock, color: 'text-purple-600', iconBg: 'bg-purple-100', label: 'Por vencer' },
}

/**
 * Los títulos y cuerpos llegan del servidor en español. Los de LOW_STOCK y EXPIRING
 * tienen forma fija («Stock bajo · X», «Quedan 4 (mínimo 5)», «Vence mañana · X»…)
 * y se traducen aquí; el nombre del producto queda tal cual.
 */
function localize(n, t) {
  let { title, body } = n
  if (n.type === 'LOW_STOCK') {
    title = title?.replace(/^Stock bajo · /, `${t('Stock bajo')} · `)
    const m = body?.match(/^Quedan (\S+) \(mínimo (\S+)\)$/)
    if (m) body = t('Quedan {n} (mínimo {m})', { n: m[1], m: m[2] })
  } else if (n.type === 'EXPIRING') {
    title = title
      ?.replace(/^Vence hoy · /, `${t('Vence hoy')} · `)
      .replace(/^Vence mañana · /, `${t('Vence mañana')} · `)
      .replace(/^Vence en (\d+) días · /, (_, d) => `${t('Vence en {n} días', { n: d })} · `)
    let m
    if ((m = body?.match(/^(\S+) en stock · vence hoy$/)))         body = t('{n} en stock · vence hoy', { n: m[1] })
    else if ((m = body?.match(/^(\S+) en stock · vence mañana$/))) body = t('{n} en stock · vence mañana', { n: m[1] })
    else if ((m = body?.match(/^(\S+) en stock · vence el (.+)$/))) body = t('{n} en stock · vence el {d}', { n: m[1], d: m[2] })
  }
  return { title, body }
}

const FALLBACK = { Icon: Bell, color: 'text-gray-500', iconBg: 'bg-gray-100' }

/**
 * Una notificación, igual en la campana y en la página. `size="lg"` da la
 * versión con más aire de la página; sin leer se marca con fondo azul suave,
 * título en negrita y el punto azul a la derecha.
 */
export default function NotificationItem({ notification: n, onClick, size = 'sm' }) {
  const t = useT()
  const { Icon, color, iconBg, label } = TYPE_CONFIG[n.type] ?? FALLBACK
  const { title, body } = localize(n, t)
  const lg = size === 'lg'

  return (
    <li
      onClick={onClick}
      className={`flex gap-3 transition-colors hover:bg-gray-50 ${lg ? 'px-4 py-4 sm:px-5' : 'px-4 py-3'} ${
        n.read ? '' : 'bg-blue-50/60'
      } ${onClick ? 'cursor-pointer' : ''}`}
      title={label ? t(label) : undefined}
    >
      <div className={`mt-0.5 flex flex-shrink-0 items-center justify-center rounded-full ${iconBg} ${lg ? 'h-10 w-10' : 'h-8 w-8'}`}>
        <Icon size={lg ? 17 : 14} className={color} />
      </div>

      <div className="min-w-0 flex-1">
        <p className={`leading-snug ${lg ? 'text-[15px]' : 'text-sm'} ${n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
          {title}
        </p>
        {body && (
          <p className={`mt-0.5 text-xs text-gray-500 ${lg ? '' : 'truncate'}`}>{body}</p>
        )}
        <p className="mt-1 text-[11px] text-gray-400">{formatRelativeTime(n.createdAt, t)}</p>
      </div>

      {!n.read && <div className="mt-2.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
    </li>
  )
}
