import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, ArrowRight } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import NotificationItem from './notifications/NotificationItem'
import { useT } from '../i18n'

// ── component ─────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef        = useRef(null)
  const t               = useT()
  const navigate        = useNavigate()
  const { notifications, total, unreadCount, isLoading, markRead, markAllRead } = useNotifications()

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
        aria-label={t('Notificaciones')}
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
              {t('Notificaciones')}
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
                {t('Marcar todas como leídas')}
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
                <p className="text-sm font-medium text-gray-400">{t('Sin notificaciones')}</p>
                <p className="mt-0.5 text-xs text-gray-300">{t('Todo está al día')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onClick={() => !n.read && markRead(n.id)} />
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => { setOpen(false); navigate('/notificaciones') }}
              className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {t('Ver todas las notificaciones')}
              {total > notifications.length && <span className="text-gray-400">({total})</span>}
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
