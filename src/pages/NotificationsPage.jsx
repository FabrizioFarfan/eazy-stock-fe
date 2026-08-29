import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BellOff, CheckCheck, Loader2 } from 'lucide-react'
import { useNotifications, useNotificationSearch } from '../hooks/useNotifications'
import NotificationItem from '../components/notifications/NotificationItem'
import LoadMoreRow from '../components/common/LoadMoreRow'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT, dateLocale } from '../i18n'

/**
 * Página de notificaciones: la campana solo muestra las últimas y sin filtros.
 * Acá está TODO el historial con scroll infinito, filtro Todas / Sin leer y
 * agrupado por día, que es donde el dueño revisa qué pasó mientras no estaba.
 */
export default function NotificationsPage() {
  const t = useT()
  const navigate = useNavigate()
  const [onlyUnread, setOnlyUnread] = useState(false)
  const search = useNotificationSearch(onlyUnread)
  const { unreadCount, markRead, markAllRead, isMarkingAll } = useNotifications()

  // Encabezado por día: «Hoy», «Ayer» o la fecha larga.
  const dayLabel = (iso) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today.getTime() - 86400000)
    const sameDay = (a, b) => a.toDateString() === b.toDateString()
    if (sameDay(d, today))     return t('Hoy')
    if (sameDay(d, yesterday)) return t('Ayer')
    return d.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // [{ label, items }] en el orden en que vienen (ya ordenadas por fecha desc).
  const groups = []
  for (const n of search.items) {
    const label = dayLabel(n.createdAt)
    if (groups[groups.length - 1]?.label !== label) groups.push({ label, items: [] })
    groups[groups.length - 1].items.push(n)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{t('Volver')}</span>
          </button>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{t('Notificaciones')}</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">{unreadCount}</span>
          )}
          <HelpDrawer title={t('Qué se avisa aquí')} autoOpenKey="eazystock_notifications_help_v1">
            <p>{t('Todo lo que pasó en tu negocio mientras no mirabas: ventas registradas, devoluciones y cambios de stock.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🔵 Sin leer')}</p>
              <p className="mt-1">{t('Las que todavía no abriste salen con fondo azul y un punto. Al tocarlas se marcan como leídas; con «Marcar todas como leídas» limpias el contador de la campana de una.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🔔 La campana vs. esta página')}</p>
              <p className="mt-1">{t('La campana de arriba muestra solo las últimas para un vistazo rápido. Acá está el historial completo, agrupado por día y con el filtro «Sin leer».')}</p>
            </div>
          </HelpDrawer>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={isMarkingAll}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {isMarkingAll ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
            {t('Marcar todas como leídas')}
          </button>
        )}
      </div>

      <div className="flex w-full items-center gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 text-xs sm:w-auto sm:self-start">
        {[[false, t('Todas')], [true, t('Sin leer')]].map(([v, label]) => (
          <button key={String(v)} onClick={() => setOnlyUnread(v)}
            className={`flex-1 rounded-lg px-4 py-1.5 font-medium transition-colors sm:flex-none ${
              onlyUnread === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {search.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : search.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BellOff size={36} className="mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">
              {onlyUnread ? t('No tienes notificaciones sin leer') : t('Sin notificaciones')}
            </p>
            <p className="mt-0.5 text-xs text-gray-300">{t('Todo está al día')}</p>
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <div key={g.label}>
                <p className="border-b border-gray-100 bg-gray-50/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:px-5">
                  {g.label}
                </p>
                <ul className="divide-y divide-gray-50">
                  {g.items.map((n) => (
                    <NotificationItem key={n.id} notification={n} size="lg"
                      onClick={() => !n.read && markRead(n.id)} />
                  ))}
                </ul>
              </div>
            ))}
            <LoadMoreRow search={search} />
          </>
        )}
      </div>
    </div>
  )
}
