import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff, ShoppingCart, Package, CheckCircle } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)   return 'Ahora mismo'
  if (mins < 60)  return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days  = Math.floor(hours / 24)
  if (days  < 7)  return `Hace ${days}d`
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(new Date(dateStr))
}

const TYPE_CONFIG = {
  NEW_SALE: {
    icon:   <ShoppingCart size={14} className="text-blue-600" />,
    iconBg: 'bg-blue-100',
  },
  SALE_CONFIRMED: {
    icon:   <CheckCircle size={14} className="text-green-600" />,
    iconBg: 'bg-green-100',
  },
  STOCK_UPDATE: {
    icon:   <Package size={14} className="text-amber-600" />,
    iconBg: 'bg-amber-100',
  },
}

// ── component ─────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef        = useRef(null)
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications()

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative rounded-xl p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <BellOff size={30} className="mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-400">Sin notificaciones</p>
                <p className="mt-0.5 text-xs text-gray-300">Todo está al día</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] ?? {
                    icon:   <Bell size={14} className="text-gray-500" />,
                    iconBg: 'bg-gray-100',
                  }
                  return (
                    <li
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
                      className={`flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                        !n.read ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${cfg.iconBg}`}
                      >
                        {cfg.icon}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug ${
                            !n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          }`}
                        >
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 truncate text-xs text-gray-500">{n.body}</p>
                        )}
                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <div className="mt-2.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-center">
              <p className="text-xs text-gray-400">Mostrando las últimas {notifications.length} notificaciones</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
