import { useCallback, useEffect, useState } from 'react'
import {
  Crown, Rocket, FlaskConical, MailCheck, CreditCard, Store, Sparkles,
  Building2, Users, ShoppingCart, Activity, CheckCircle2, Loader2, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { bossApi } from '../services/endpoints/boss'

/* ── Roadmap (espejo de ROADMAP.md) ──────────────────────────────────────── */

const PHASES = [
  {
    icon: Rocket, title: 'Producto base', status: 'done', progress: 100,
    desc: 'POS completo, stock, fiado, proveedores, reportes, permisos, auditoría.',
    items: [
      { label: 'Punto de venta con escáner y descuentos', done: true },
      { label: 'Stock, recepciones y alertas de mínimo', done: true },
      { label: 'Cuentas por cobrar y pagar', done: true },
      { label: 'Multi-usuario con permisos granulares', done: true },
    ],
  },
  {
    icon: FlaskConical, title: 'Piloto — Farmacia Perú', status: 'now', progress: 50,
    desc: 'Validar que un usuario nuevo entiende la app sin que nadie se la explique.',
    items: [
      { label: 'Tutorial contextual en todas las páginas', done: true },
      { label: 'Editar perfil propio y datos del negocio', done: true },
      { label: 'Credenciales para la farmacia', done: false },
      { label: 'Feedback semanal del piloto', done: false },
    ],
  },
  {
    icon: MailCheck, title: 'Registro + verificación de email', status: 'next', progress: 0,
    desc: 'Cualquiera crea su cuenta solo: registro público, email de confirmación, recuperar contraseña.',
    items: [
      { label: 'Pantalla pública de registro (OWNER + negocio)', done: false },
      { label: 'Verificación de email con link', done: false },
      { label: 'Recuperación de contraseña', done: false },
    ],
  },
  {
    icon: CreditCard, title: 'Suscripción — 14 días gratis', status: 'future', progress: 0,
    desc: 'Trial → activa → vencida (solo lectura). Pasarela: Culqi / Mercado Pago / Izipay.',
    items: [
      { label: 'Estados de suscripción por negocio', done: false },
      { label: 'Pasarela de pago + recordatorios', done: false },
      { label: 'Página de precios en la landing', done: false },
    ],
  },
  {
    icon: Store, title: 'Multi-negocio', status: 'future', progress: 0,
    desc: 'Un OWNER gestiona varios negocios y paga por cada extra. Upsell natural.',
    items: [
      { label: 'Selector de negocio en el topbar', done: false },
      { label: 'Precio por negocio adicional', done: false },
    ],
  },
  {
    icon: Sparkles, title: 'Premium IA', status: 'future', progress: 0,
    desc: '"Este producto se te acaba cada 12 días, pide antes del martes." El plan caro.',
    items: [
      { label: 'Insights automáticos de stock y ventas', done: false },
      { label: 'Asistente IA dentro de la app', done: false },
    ],
  },
]

const STATUS_CFG = {
  done:   { badge: 'Completado',    badgeCls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500',              iconCls: 'bg-emerald-500' },
  now:    { badge: 'En curso',      badgeCls: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-600 animate-pulse',   iconCls: 'bg-blue-600' },
  next:   { badge: 'Siguiente',     badgeCls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400',                iconCls: 'bg-amber-500' },
  future: { badge: 'Más adelante',  badgeCls: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-300',                iconCls: 'bg-slate-400' },
}

const OVERALL_PROGRESS = Math.round(
  PHASES.reduce((acc, p) => acc + p.progress, 0) / PHASES.length,
)

/* ── Helpers de actividad ────────────────────────────────────────────────── */

// Todos los timestamps del BE son LocalDateTime "naive"; los comparamos contra
// serverTime (mismo reloj) para que "hace X min" no dependa de zonas horarias.
const parseTs = (s) => (s ? new Date(s).getTime() : null)

function activityInfo(lastSeenAt, serverTs) {
  const ts = parseTs(lastSeenAt)
  if (!ts || !serverTs) {
    return { level: 'never', label: 'Nunca entró', dot: 'bg-gray-300', text: 'text-gray-400' }
  }
  const min = Math.max(0, Math.floor((serverTs - ts) / 60000))
  if (min < 10)   return { level: 'online', label: 'En línea ahora', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-600' }
  if (min < 60)   return { level: 'today',  label: `Hace ${min} min`, dot: 'bg-emerald-400', text: 'text-emerald-600' }
  const h = Math.floor(min / 60)
  if (h < 24)     return { level: 'today',  label: `Hace ${h} h`, dot: 'bg-emerald-400', text: 'text-emerald-600' }
  const d = Math.floor(h / 24)
  if (d === 1)    return { level: 'week',   label: 'Ayer', dot: 'bg-amber-400', text: 'text-amber-600' }
  if (d < 7)      return { level: 'week',   label: `Hace ${d} días`, dot: 'bg-amber-400', text: 'text-amber-600' }
  if (d < 30)     return { level: 'cold',   label: `Hace ${d} días`, dot: 'bg-gray-300', text: 'text-gray-400' }
  const m = Math.floor(d / 30)
  return { level: 'cold', label: m === 1 ? 'Hace 1 mes' : `Hace ${m} meses`, dot: 'bg-gray-300', text: 'text-gray-400' }
}

function lastSaleLabel(lastSaleAt, serverTs) {
  const ts = parseTs(lastSaleAt)
  if (!ts || !serverTs) return 'Sin ventas aún'
  const min = Math.max(0, Math.floor((serverTs - ts) / 60000))
  if (min < 60) return `Última venta hace ${Math.max(1, min)} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Última venta hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Última venta ayer' : `Última venta hace ${d} días`
}

const flagEmoji = (cc) =>
  cc && cc.length === 2
    ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
    : '🌐'

const ROLE_CHIP = {
  BOSS:        'bg-amber-100 text-amber-700',
  SUPER_ADMIN: 'bg-indigo-100 text-indigo-700',
  OWNER:       'bg-blue-100 text-blue-700',
  EMPLOYEE:    'bg-slate-100 text-slate-600',
}
const ROLE_SHORT = { BOSS: 'Boss', SUPER_ADMIN: 'Admin', OWNER: 'Owner', EMPLOYEE: 'Empleado' }

/* ── Sub-componentes ─────────────────────────────────────────────────────── */

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Icon size={14} className={accent} />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-extrabold text-white">{value}</p>
    </div>
  )
}

function PhaseCard({ phase, isLast }) {
  const cfg = STATUS_CFG[phase.status]
  const Icon = phase.icon
  const highlight = phase.status === 'now'
  return (
    <li className="relative flex gap-4">
      {/* Timeline: nodo + conector */}
      <div className="flex flex-col items-center">
        <div className={`z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${cfg.iconCls} text-white shadow-lg`}>
          <Icon size={20} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-200 to-gray-100" />}
      </div>

      {/* Card */}
      <div className={`mb-5 flex-1 rounded-2xl border bg-white p-4 shadow-sm transition-all ${
        highlight ? 'border-blue-200 ring-2 ring-blue-600/10' : 'border-gray-100'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-gray-900">{phase.title}</h4>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.badgeCls}`}>
            {cfg.badge}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{phase.desc}</p>

        <ul className="mt-3 space-y-1.5">
          {phase.items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-xs">
              {item.done ? (
                <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-500" />
              ) : (
                <span className={`ml-0.5 mr-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 ${
                  highlight ? 'border-blue-300' : 'border-gray-200'
                }`} />
              )}
              <span className={item.done ? 'text-gray-400 line-through decoration-emerald-300' : 'text-gray-600'}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        {phase.progress > 0 && phase.progress < 100 && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
              style={{ width: `${phase.progress}%` }}
            />
          </div>
        )}
      </div>
    </li>
  )
}

function BusinessCard({ biz, serverTs }) {
  const sale = lastSaleLabel(biz.lastSaleAt, serverTs)
  const hot = biz.salesLast7Days > 0
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header del negocio */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl">{flagEmoji(biz.countryCode)}</span>
          <p className="truncate text-sm font-bold text-gray-900">{biz.name}</p>
          {!biz.active && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-500">Inactivo</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            hot ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'
          }`}>
            <ShoppingCart size={11} />
            {biz.salesLast7Days} venta{biz.salesLast7Days === 1 ? '' : 's'} · 7d
          </span>
          <span className="hidden text-[11px] text-gray-400 sm:inline">{sale}</span>
        </div>
      </div>

      {/* Usuarios */}
      <ul className="divide-y divide-gray-50 px-4">
        {biz.users.length === 0 && (
          <li className="py-3 text-xs text-gray-400">Sin usuarios registrados</li>
        )}
        {biz.users.map((u) => {
          const act = activityInfo(u.lastSeenAt, serverTs)
          return (
            <li key={u.id} className="flex items-center gap-3 py-2.5">
              <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${act.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`truncate text-sm font-semibold ${u.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                    {u.name}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_CHIP[u.role] ?? 'bg-gray-100 text-gray-500'}`}>
                    {ROLE_SHORT[u.role] ?? u.role}
                  </span>
                  {!u.active && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-400">Desactivado</span>
                  )}
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
  const { user } = useAuth()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await bossApi.getActivity()
      setData(res.data.data ?? res.data)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const serverTs   = parseTs(data?.serverTime)
  const businesses = data?.businesses ?? []
  const activeBiz  = businesses.filter((b) => b.active)
  const allUsers   = businesses.flatMap((b) => b.users)
  const activeToday = serverTs
    ? allUsers.filter((u) => ['online', 'today'].includes(activityInfo(u.lastSeenAt, serverTs).level)).length
    : 0
  const sales7d = businesses.reduce((acc, b) => acc + b.salesLast7Days, 0)
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">

      {/* ── Hero Boss ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] via-slate-800 to-indigo-950 p-6 shadow-xl">
        {/* Corona de fondo, como el watermark de PageTitle */}
        <Crown
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rotate-12 text-amber-400 opacity-10"
          strokeWidth={1.5}
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20">
              <Crown size={18} className="text-amber-400" />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Modo Boss</p>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold text-white">
            {firstName ? `${firstName}, esto ya es un imperio en marcha` : 'Esto ya es un imperio en marcha'} 🚀
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Cada venta que se registra abajo existe porque tú construiste esto.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={Building2}    label="Negocios"     value={activeBiz.length}  accent="text-blue-400" />
            <StatTile icon={Users}        label="Usuarios"     value={allUsers.length}   accent="text-violet-400" />
            <StatTile icon={Activity}     label="Activos hoy"  value={activeToday}       accent="text-emerald-400" />
            <StatTile icon={ShoppingCart} label="Ventas · 7d"  value={sales7d}           accent="text-amber-400" />
          </div>
        </div>
      </div>

      {/* ── Roadmap ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-gray-900">🗺️ La ruta a SaaS</h3>
            <span className="text-xs font-bold text-blue-600">{OVERALL_PROGRESS}% recorrido</span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600"
              style={{ width: `${OVERALL_PROGRESS}%` }}
            />
          </div>
        </div>
        <ol className="px-5 pt-5">
          {PHASES.map((phase, i) => (
            <PhaseCard key={phase.title} phase={phase} isLast={i === PHASES.length - 1} />
          ))}
        </ol>
      </div>

      {/* ── Actividad ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">👀 ¿Quién lo está usando?</h3>
          <button
            onClick={() => { setLoading(true); load() }}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-10 text-sm text-gray-400 shadow-sm">
            <Loader2 size={16} className="animate-spin" /> Cargando actividad...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-500">
            No se pudo cargar la actividad. Intenta actualizar.
          </div>
        )}

        {!loading && !error && businesses.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-8 text-center text-sm text-gray-400 shadow-sm">
            Aún no hay negocios registrados.
          </div>
        )}

        {!loading && !error && businesses.map((biz) => (
          <BusinessCard key={biz.id} biz={biz} serverTs={serverTs} />
        ))}
      </div>

      <p className="pb-2 text-center text-xs text-gray-300">
        La actividad se registra con cada uso real de la app (precisión ~5 min).
      </p>
    </div>
  )
}
