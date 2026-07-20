import { CalendarClock, CalendarX } from 'lucide-react'
import { formatShortDate } from '../../utils/formatDate'

/**
 * Pill de vencimiento coherente en toda la app:
 *   - vencido        → rojo "Vencido" (+ hace cuántos días)
 *   - por vencer      → ámbar "Vence en X d"
 *   - con fecha lejana → gris sutil con la fecha
 *   - sin fecha        → nada (o "—" si dash)
 *
 * Espera los campos calculados por el backend: expirationDate, expired,
 * expiringSoon, daysToExpire.
 */
export default function ExpiryBadge({ product, dash = false, className = '' }) {
  const { expirationDate, expired, expiringSoon, daysToExpire } = product || {}

  if (!expirationDate) {
    return dash ? <span className={`text-gray-300 ${className}`}>—</span> : null
  }

  if (expired) {
    const ago = daysToExpire != null ? Math.abs(daysToExpire) : null
    return (
      <span title={`Venció el ${formatShortDate(expirationDate)}`}
        className={`inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-100 ${className}`}>
        <CalendarX size={11} />
        {ago === 0 ? 'Vence hoy' : `Vencido${ago != null ? ` · ${ago}d` : ''}`}
      </span>
    )
  }

  if (expiringSoon) {
    return (
      <span title={`Vence el ${formatShortDate(expirationDate)}`}
        className={`inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100 ${className}`}>
        <CalendarClock size={11} />
        {daysToExpire === 0 ? 'Vence hoy' : `Vence en ${daysToExpire}d`}
      </span>
    )
  }

  // Fecha lejana: informativo, sin alarma
  return (
    <span title={`Vence el ${formatShortDate(expirationDate)}`}
      className={`inline-flex items-center gap-1 text-xs text-gray-500 ${className}`}>
      <CalendarClock size={11} className="text-gray-400" />
      {formatShortDate(expirationDate)}
    </span>
  )
}
