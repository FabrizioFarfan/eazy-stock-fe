import { Bell, ShoppingCart, Package, CheckCircle, RotateCcw } from 'lucide-react'
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
// (SALE_RETURN) y StockMovementService (STOCK_UPDATE).
const TYPE_CONFIG = {
  NEW_SALE:       { Icon: ShoppingCart, color: 'text-blue-600',   iconBg: 'bg-blue-100' },
  SALE_CONFIRMED: { Icon: CheckCircle,  color: 'text-green-600',  iconBg: 'bg-green-100' },
  SALE_RETURN:    { Icon: RotateCcw,    color: 'text-orange-600', iconBg: 'bg-orange-100' },
  STOCK_UPDATE:   { Icon: Package,      color: 'text-amber-600',  iconBg: 'bg-amber-100' },
}

const FALLBACK = { Icon: Bell, color: 'text-gray-500', iconBg: 'bg-gray-100' }

/**
 * Una notificación, igual en la campana y en la página. `size="lg"` da la
 * versión con más aire de la página; sin leer se marca con fondo azul suave,
 * título en negrita y el punto azul a la derecha.
 */
export default function NotificationItem({ notification: n, onClick, size = 'sm' }) {
  const t = useT()
  const { Icon, color, iconBg } = TYPE_CONFIG[n.type] ?? FALLBACK
  const lg = size === 'lg'

  return (
    <li
      onClick={onClick}
      className={`flex gap-3 transition-colors hover:bg-gray-50 ${lg ? 'px-4 py-4 sm:px-5' : 'px-4 py-3'} ${
        n.read ? '' : 'bg-blue-50/60'
      } ${onClick && !n.read ? 'cursor-pointer' : ''}`}
    >
      <div className={`mt-0.5 flex flex-shrink-0 items-center justify-center rounded-full ${iconBg} ${lg ? 'h-10 w-10' : 'h-8 w-8'}`}>
        <Icon size={lg ? 17 : 14} className={color} />
      </div>

      <div className="min-w-0 flex-1">
        <p className={`leading-snug ${lg ? 'text-[15px]' : 'text-sm'} ${n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
          {n.title}
        </p>
        {n.body && (
          <p className={`mt-0.5 text-xs text-gray-500 ${lg ? '' : 'truncate'}`}>{n.body}</p>
        )}
        <p className="mt-1 text-[11px] text-gray-400">{formatRelativeTime(n.createdAt, t)}</p>
      </div>

      {!n.read && <div className="mt-2.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
    </li>
  )
}
