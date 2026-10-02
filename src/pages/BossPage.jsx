import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Crown, Rocket, FlaskConical, Paintbrush, ClipboardList, CreditCard, Wallet, Smartphone, Mic, Sparkles,
  Building2, Users, ShoppingCart, Activity, CheckCircle2, Check, X, XCircle, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, Map,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { bossApi } from '../services/endpoints/boss'
import { ReportHeader, ReportHero } from '../components/reports/ReportKit'
import { BossSwitcher, FlagAvatar } from '../components/boss/BossKit'
import { APP_VERSION } from '../utils/version'

/* ── La ruta (espejo de ROADMAP.md + plan oficial M1–M5 del 17-sep) ──────────
 * status: done · failed (se intentó y no salió: la ruta sigue) · now · next · future
 * items: { label, done?, failed? }
 */

const PHASES = [
  {
    key: 'base', icon: Rocket, title: 'Producto base', status: 'done', progress: 100,
    desc: 'POS completo, stock, fiado, proveedores, reportes, permisos, auditoría.',
    items: [
      { label: 'Punto de venta con escáner y descuentos', done: true },
      { label: 'Stock, recepciones y alertas de mínimo', done: true },
      { label: 'Cuentas por cobrar y pagar', done: true },
      { label: 'Multi-usuario con permisos granulares', done: true },
    ],
  },
  {
    key: 'pilot', icon: FlaskConical, title: 'Piloto — Farmacia Perú', status: 'failed', progress: 100,
    desc: 'Entró una vez, registró una venta y no volvió. Lección: la primera sesión tiene que enganchar sola.',
    items: [
      { label: 'Tutorial contextual en todas las páginas', done: true },
      { label: 'Editar perfil propio y datos del negocio', done: true },
      { label: 'Credenciales para la farmacia', done: true },
      { label: 'Primera venta registrada', done: true },
      { label: 'Feedback semanal del piloto', failed: true },
    ],
  },
  {
    key: 'design', icon: Paintbrush, title: 'Diseño nuevo', status: 'now', progress: 80,
    desc: 'Toda la app con el mismo lenguaje: franja azul, accesos grandes y tarjetas en el celular.',
    items: [
      { label: 'Páginas del dueño', done: true },
      { label: 'Páginas del vendedor (las mismas, con restricciones)', done: true },
      { label: 'Lado Boss: panel, negocios y owners', done: true },
      { label: 'Modales que faltan: recepción, ajuste, QR, borrar, detalle de venta' },
      { label: 'Pestañas secundarias de Reportes' },
    ],
  },
  {
    key: 'william', icon: ClipboardList, title: 'Pedidos de William', status: 'next', progress: 0,
    desc: 'Lo que pidió FERREFANO, el negocio que más usa la app: lo próximo al cerrar el diseño.',
    items: [
      { label: 'Repasar la lista con Frank y ordenarla' },
      { label: 'Entregar de a uno y verificarlo con él en vivo' },
    ],
  },
  {
    key: 'm1', icon: CreditCard, title: 'M1 · Planes y límites', status: 'future', progress: 0,
    desc: 'Basic / Pro / AI: modelo de plan y suscripción, límites en el servidor, pantalla de planes y upgrade.',
    items: [
      { label: 'Modelo Plan / Suscripción / límites' },
      { label: 'Límites aplicados en el servidor' },
      { label: 'Pantalla de planes + botón de upgrade' },
      { label: 'Migrar la cuenta de William sin romper nada' },
    ],
  },
  {
    key: 'm2', icon: Wallet, title: 'M2 · Pagos reales', status: 'future', progress: 0,
    desc: 'Proveedor de pago en soles, checkout mensual/anual, estados de la suscripción y recibos.',
    items: [
      { label: 'Decidir proveedor de pago y quién factura' },
      { label: 'Checkout mensual / anual' },
      { label: 'Webhooks y estados: prueba, activa, vencida, cancelada' },
    ],
  },
  {
    key: 'm3', icon: Smartphone, title: 'M3 · Apps móviles', status: 'future', progress: 0,
    desc: 'Ventas, inventario y recepciones en Android e iOS, con login por rol y paywall.',
    items: [
      { label: 'Decidir stack y alcance del MVP' },
      { label: 'Login con roles y paywall' },
      { label: 'Publicar en Play Store y App Store' },
    ],
  },
  {
    key: 'm4', icon: Mic, title: 'M4 · IA: venta por nota de voz', status: 'future', progress: 0,
    desc: 'Dictas la venta, la app arma el borrador contra tu catálogo y tú confirmas. Nunca registra sola.',
    items: [
      { label: 'Captura de audio y transcripción' },
      { label: 'Emparejar con el catálogo real' },
      { label: 'Borrador de venta a confirmar' },
    ],
  },
  {
    key: 'm5', icon: Sparkles, title: 'M5 · IA: análisis y ofertas', status: 'future', progress: 0,
    desc: '«Este producto se te acaba cada 12 días, pide antes del martes.» Ofertas que el dueño aprueba.',
    items: [
      { label: 'Top, lentos y por vencer, automáticos' },
      { label: 'Ofertas sugeridas con aprobación del dueño' },
      { label: 'Envío por WhatsApp / SMS con seguimiento' },
    ],
  },
]

const STATUS_CFG = {
  done:   { badge: 'Completado',          badgeCls: 'bg-emerald-50 text-emerald-700', node: 'bg-emerald-500 text-white',  line: 'bg-emerald-400' },
  failed: { badge: 'Completado · falló',  badgeCls: 'bg-red-50 text-red-600',         node: 'bg-red-500 text-white',      line: 'bg-red-300' },
  now:    { badge: 'En curso',            badgeCls: 'bg-blue-50 text-blue-700',       node: 'bg-blue-600 text-white',     line: 'bg-gray-200' },
  next:   { badge: 'Siguiente',           badgeCls: 'bg-amber-50 text-amber-700',     node: 'bg-amber-400 text-white',    line: 'bg-gray-200' },
  future: { badge: 'Más adelante',        badgeCls: 'bg-gray-100 text-gray-500',      node: 'bg-gray-300 text-white',     line: 'bg-gray-200' },
}

const isClosed = (p) => p.status === 'done' || p.status === 'failed'
const OVERALL_PROGRESS = Math.round(PHASES.reduce((acc, p) => acc + p.progress, 0) / PHASES.length)

/* ── Helpers de actividad ────────────────────────────────────────────────── */

// Todos los timestamps del BE son LocalDateTime "naive"; los comparamos contra
// serverTime (mismo reloj) para que "hace X min" no dependa de zonas horarias.
const parseTs = (s) => (s ? new Date(s).getTime() : null)

function activityInfo(lastSeenAt, serverTs, t = (s) => s) {
  const ts = parseTs(lastSeenAt)
  if (!ts || !serverTs) {
    return { level: 'never', label: t('Nunca entró'), dot: 'bg-gray-300', text: 'text-gray-400' }
  }
  const min = Math.max(0, Math.floor((serverTs - ts) / 60000))
  if (min < 10)   return { level: 'online', label: t('En línea ahora'), dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-600' }
  if (min < 60)   return { level: 'today',  label: t('Hace {n} min', { n: min }), dot: 'bg-emerald-400', text: 'text-emerald-600' }
  const h = Math.floor(min / 60)
  if (h < 24)     return { level: 'today',  label: t('Hace {n} h', { n: h }), dot: 'bg-emerald-400', text: 'text-emerald-600' }
  const d = Math.floor(h / 24)
  if (d === 1)    return { level: 'week',   label: t('Ayer'), dot: 'bg-amber-400', text: 'text-amber-600' }
  if (d < 7)      return { level: 'week',   label: t('Hace {n} días', { n: d }), dot: 'bg-amber-400', text: 'text-amber-600' }
  if (d < 30)     return { level: 'cold',   label: t('Hace {n} días', { n: d }), dot: 'bg-gray-300', text: 'text-gray-400' }
  const m = Math.floor(d / 30)
  return { level: 'cold', label: m === 1 ? t('Hace 1 mes') : t('Hace {n} meses', { n: m }), dot: 'bg-gray-300', text: 'text-gray-400' }
}

function lastSaleLabel(lastSaleAt, serverTs, t) {
  const ts = parseTs(lastSaleAt)
  if (!ts || !serverTs) return t('Sin ventas aún')
  const min = Math.max(0, Math.floor((serverTs - ts) / 60000))
  if (min < 60) return t('Última venta hace {n} min', { n: Math.max(1, min) })
  const h = Math.floor(min / 60)
  if (h < 24) return t('Última venta hace {n} h', { n: h })
  const d = Math.floor(h / 24)
  return d === 1 ? t('Última venta ayer') : t('Última venta hace {n} días', { n: d })
}

const ROLE_CHIP = {
  BOSS:        'bg-amber-100 text-amber-700',
  SUPER_ADMIN: 'bg-indigo-100 text-indigo-700',
  OWNER:       'bg-blue-100 text-blue-700',
  EMPLOYEE:    'bg-gray-100 text-gray-600',
}
const ROLE_SHORT = { BOSS: 'Boss', SUPER_ADMIN: 'Admin', OWNER: 'Owner', EMPLOYEE: 'Empleado' }

/* ── La ruta: estaciones en horizontal, enfocada en la actual ─────────────── */

function Station({ phase, index, focused, onFocus, nodeRef }) {
  const t = useT()
  const cfg = STATUS_CFG[phase.status]
  const Icon = phase.icon
  const prev = PHASES[index - 1]
  const leftLine  = index === 0 ? 'bg-transparent' : (isClosed(prev) ? STATUS_CFG[prev.status].line : 'bg-gray-200')
  const rightLine = index === PHASES.length - 1 ? 'bg-transparent' : (isClosed(phase) ? cfg.line : 'bg-gray-200')
  const doneCount = phase.items.filter((i) => i.done).length
  const NodeMark = phase.status === 'done' ? Check : phase.status === 'failed' ? X : Icon

  return (
    <li ref={nodeRef}
      className={`snap-center flex-shrink-0 transition-[width] duration-300 ${focused ? 'w-[17rem] sm:w-80' : 'w-44 sm:w-52'}`}>
      {/* Riel + estación */}
      <div className="flex items-center">
        <span className={`h-1 flex-1 ${leftLine}`} />
        <button type="button" onClick={onFocus} aria-current={focused ? 'step' : undefined}
          title={t(phase.title)}
          className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl shadow-md transition-transform ${cfg.node} ${
            focused ? 'scale-110' : 'hover:scale-105'}`}>
          {phase.status === 'now' && <span className="absolute inset-0 animate-ping rounded-2xl bg-blue-600/40" />}
          <NodeMark size={phase.status === 'done' || phase.status === 'failed' ? 22 : 19} strokeWidth={phase.status === 'done' || phase.status === 'failed' ? 3 : 2} className="relative" />
        </button>
        <span className={`h-1 flex-1 ${rightLine}`} />
      </div>

      {/* Tarjeta de la estación */}
      <button type="button" onClick={onFocus}
        className={`mx-2 mt-3 block w-[calc(100%-1rem)] rounded-2xl border p-3.5 text-left transition-all ${
          focused ? 'border-blue-200 bg-white shadow-md ring-2 ring-blue-600/10' : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'}`}>
        {/* Enfocada: título y etiqueta en la misma línea. Compacta: el título a lo
            ancho y la etiqueta debajo, para que «M1 · Planes y límites» no se corte. */}
        <div className={focused ? 'flex items-start justify-between gap-2' : ''}>
          <h4 className={`text-sm font-bold leading-snug text-gray-900 ${focused ? '' : 'line-clamp-2'}`}>{t(phase.title)}</h4>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.badgeCls} ${focused ? 'flex-shrink-0' : 'mt-1.5'}`}>{t(cfg.badge)}</span>
        </div>
        <p className={`mt-1 text-xs leading-relaxed text-gray-500 ${focused ? '' : 'line-clamp-2'}`}>{t(phase.desc)}</p>

        {focused ? (
          <ul className="mt-3 space-y-1.5">
            {phase.items.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-xs">
                {item.done ? (
                  <CheckCircle2 size={14} className="mt-px flex-shrink-0 text-emerald-500" />
                ) : item.failed ? (
                  <XCircle size={14} className="mt-px flex-shrink-0 text-red-500" />
                ) : (
                  <span className={`ml-0.5 mr-0.5 mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 ${
                    phase.status === 'now' ? 'border-blue-300' : 'border-gray-200'}`} />
                )}
                <span className={item.done ? 'text-gray-400 line-through decoration-emerald-300'
                  : item.failed ? 'font-semibold text-red-600' : 'text-gray-700'}>
                  {t(item.label)}{item.failed && <span className="font-normal text-red-400"> · {t('no volvió a entrar')}</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[11px] font-semibold text-gray-400">{t('{d}/{n} hechos', { d: doneCount, n: phase.items.length })}</p>
        )}

        {phase.progress > 0 && phase.progress < 100 && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${phase.progress}%` }} />
          </div>
        )}
      </button>
    </li>
  )
}

function RoadmapStrip() {
  const t = useT()
  const nowIdx = Math.max(0, PHASES.findIndex((p) => p.status === 'now'))
  const [focus, setFocus] = useState(nowIdx)
  const scrollerRef = useRef(null)
  const nodeRefs = useRef([])
  const firstRender = useRef(true)

  // Centra la estación enfocada en el riel: sin animación al abrir (y sin mover
  // la página), suave al tocar otra.
  useEffect(() => {
    const sc = scrollerRef.current, el = nodeRefs.current[focus]
    if (!sc || !el) return
    const left = el.offsetLeft - (sc.clientWidth - el.clientWidth) / 2
    sc.scrollTo({ left: Math.max(0, left), behavior: firstRender.current ? 'auto' : 'smooth' })
    firstRender.current = false
  }, [focus])

  const current = PHASES[focus]
  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Map size={17} /></span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t('La ruta a SaaS')}</h3>
            <p className="text-[11px] text-gray-400">{t('Toca una estación para abrirla · estás en «{phase}»', { phase: t(current.title) })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600">{t('{n}% recorrido', { n: OVERALL_PROGRESS })}</span>
          <div className="hidden items-center gap-1 sm:flex">
            <button type="button" onClick={() => setFocus((f) => Math.max(0, f - 1))} disabled={focus === 0} aria-label={t('Anterior')}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button type="button" onClick={() => setFocus((f) => Math.min(PHASES.length - 1, f + 1))} disabled={focus === PHASES.length - 1} aria-label={t('Siguiente')}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
      <div className="mx-5 mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600" style={{ width: `${OVERALL_PROGRESS}%` }} />
      </div>

      <ol ref={scrollerRef} className="flex snap-x snap-mandatory items-start overflow-x-auto px-3 pb-5 pt-4 sm:snap-none">
        {PHASES.map((phase, i) => (
          <Station key={phase.key} phase={phase} index={i} focused={i === focus}
            onFocus={() => setFocus(i)} nodeRef={(el) => { nodeRefs.current[i] = el }} />
        ))}
      </ol>
    </section>
  )
}

/* ── Actividad por negocio ───────────────────────────────────────────────── */

function BusinessCard({ biz, serverTs }) {
  const t = useT()
  const sale = lastSaleLabel(biz.lastSaleAt, serverTs, t)
  const hot = biz.salesLast7Days > 0
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-50 px-4 py-3.5">
        <FlagAvatar code={biz.countryCode} className="!h-11 !w-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight text-gray-900">{biz.name}</p>
          <p className="truncate text-[11px] text-gray-400">{sale}</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            hot ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
            <ShoppingCart size={11} />
            {biz.salesLast7Days === 1 ? t('1 venta · 7d') : t('{n} ventas · 7d', { n: biz.salesLast7Days })}
          </span>
          {!biz.active && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">{t('Inactivo')}</span>}
        </div>
      </div>

      <ul className="flex-1 divide-y divide-gray-50 px-4">
        {biz.users.length === 0 && <li className="py-3 text-xs text-gray-400">{t('Sin usuarios registrados')}</li>}
        {biz.users.map((u) => {
          const act = activityInfo(u.lastSeenAt, serverTs, t)
          return (
            <li key={u.id} className="flex items-center gap-3 py-2.5">
              <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${act.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`truncate text-sm font-semibold ${u.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{u.name}</p>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_CHIP[u.role] ?? 'bg-gray-100 text-gray-500'}`}>
                    {ROLE_SHORT[u.role] ? t(ROLE_SHORT[u.role]) : u.role}
                  </span>
                  {!u.active && <span className="flex-shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-400">{t('Desactivado')}</span>}
                </div>
                <p className="truncate text-[11px] text-gray-400">{u.email}</p>
              </div>
              <span className={`flex-shrink-0 text-xs font-semibold ${act.text}`}>{act.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ── Página ──────────────────────────────────────────────────────────────── */

export default function BossPage() {
  const t = useT()
  const { user } = useAuth()
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['boss-activity'],
    queryFn: () => bossApi.getActivity().then((r) => r.data.data ?? r.data),
  })
  const loading = isLoading || isFetching
  const error = isError

  const serverTs   = parseTs(data?.serverTime)
  const businesses = data?.businesses ?? []
  const activeBiz  = businesses.filter((b) => b.active)
  const allUsers   = businesses.flatMap((b) => b.users)
  const activeToday = serverTs
    ? allUsers.filter((u) => ['online', 'today'].includes(activityInfo(u.lastSeenAt, serverTs).level)).length
    : 0
  const sales7d  = businesses.reduce((acc, b) => acc + b.salesLast7Days, 0)
  const selling  = businesses.filter((b) => b.salesLast7Days > 0).length
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Crown} title={t('Panel Boss')}
        subtitle={firstName ? t('{name}, esto ya es un imperio en marcha', { name: firstName }) : t('Esto ya es un imperio en marcha')}
        right={(
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500"
            title={t('Versión de la app y del servidor')}>
            App v{APP_VERSION}
            <span className="text-gray-300">·</span>
            API {data?.apiVersion ? `v${data.apiVersion}` : '…'}
          </span>
        )} />

      <BossSwitcher />

      <ReportHero icon={ShoppingCart} label={t('Ventas en toda la plataforma · 7 días')} loading={loading}
        value={sales7d}
        sub={<span>{selling === 1 ? t('1 negocio vendió esta semana') : t('{n} negocios vendieron esta semana', { n: selling })}</span>}
        cells={[
          [t('Negocios activos'), activeBiz.length],
          [t('Usuarios'), allUsers.length],
          [t('Activos hoy'), activeToday],
          [t('Negocios vendiendo'), selling],
        ]} />

      <RoadmapStrip />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Activity size={17} /></span>
            <h3 className="text-sm font-bold text-gray-900">{t('¿Quién lo está usando?')}</h3>
          </div>
          <button type="button" onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {t('Actualizar')}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-10 text-sm text-gray-400 shadow-sm">
            <Loader2 size={16} className="animate-spin" /> {t('Cargando actividad...')}
          </div>
        )}
        {error && !loading && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-500">
            {t('No se pudo cargar la actividad. Intenta actualizar.')}
          </div>
        )}
        {!loading && !error && businesses.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-8 text-center text-sm text-gray-400 shadow-sm">
            {t('Aún no hay negocios registrados.')}
          </div>
        )}
        {!loading && !error && businesses.length > 0 && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {businesses.map((biz) => <BusinessCard key={biz.id} biz={biz} serverTs={serverTs} />)}
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-2 pb-2 text-center text-xs text-gray-300">
        <Building2 size={12} /><Users size={12} />
        {t('La actividad se registra con cada uso real de la app (precisión ~5 min).')}
      </p>
    </div>
  )
}
