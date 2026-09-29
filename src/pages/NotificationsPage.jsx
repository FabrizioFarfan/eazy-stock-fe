import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BellOff, CheckCheck, Loader2, Bell, BellDot, CalendarDays } from 'lucide-react'
import { ReportHero, ReportHeader } from '../components/reports/ReportKit'
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

  // Cifras de la franja (sobre lo ya cargado: el historial viene de a páginas).
  const now = new Date()
  const todayCount = search.items.filter((n) => new Date(n.createdAt).toDateString() === now.toDateString()).length
  const weekCount  = search.items.filter((n) => now - new Date(n.createdAt) < 7 * 86400000).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">{t('Volver')}</span>
        </button>
        <div className="min-w-0 flex-1">
          <ReportHeader icon={Bell} title={t('Notificaciones')}
            subtitle={t('Todo lo que pasó en tu negocio mientras no mirabas')}
            help={(
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
            )} />
        </div>
      </div>

      {/* Franja: lo pendiente de leer */}
      <ReportHero icon={Bell} label={t('Sin leer')} loading={search.isLoading}
        value={unreadCount}
        sub={<span>{unreadCount > 0 ? t('Tócalas para marcarlas como leídas') : t('Todo está al día')}</span>}
        cells={[
          [t('Hoy'), todayCount],
          [t('Últimos 7 días'), weekCount],
        ]}>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={isMarkingAll}
            className="relative mt-4 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50 disabled:opacity-60">
            {isMarkingAll ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
            {t('Marcar todas como leídas')}
          </button>
        )}
      </ReportHero>

      {/* Filtro */}
      <div className="flex flex-wrap gap-2">
        {[[false, t('Todas'), null, Bell], [true, t('Sin leer'), unreadCount, BellDot]].map(([v, label, n, Icon]) => (
          <button key={String(v)} type="button" onClick={() => setOnlyUnread(v)} aria-pressed={onlyUnread === v}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
              onlyUnread === v
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}>
            <Icon size={15} className={onlyUnread === v ? 'text-white' : 'text-gray-400'} />
            {label}
            {n > 0 && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${onlyUnread === v ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>{n}</span>}
          </button>
        ))}
      </div>

      {search.isLoading ? (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-20 text-center shadow-sm">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"><BellOff size={30} /></div>
          <p className="text-sm font-semibold text-gray-600">
            {onlyUnread ? t('No tienes notificaciones sin leer') : t('Sin notificaciones')}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{t('Todo está al día')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.label} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 sm:px-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays size={15} /></span>
                <p className="text-sm font-bold text-gray-900 first-letter:uppercase">{g.label}</p>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">{g.items.length}</span>
                {g.items.some((n) => !n.read) && (
                  <span className="ml-auto text-xs font-semibold text-blue-600">{t('{n} sin leer', { n: g.items.filter((n) => !n.read).length })}</span>
                )}
              </div>
              <ul className="divide-y divide-gray-50">
                {g.items.map((n) => (
                  <NotificationItem key={n.id} notification={n} size="lg"
                    onClick={() => !n.read && markRead(n.id)} />
                ))}
              </ul>
            </div>
          ))}
          <LoadMoreRow search={search} />
        </div>
      )}
    </div>
  )
}
