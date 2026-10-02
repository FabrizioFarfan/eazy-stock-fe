import { Crown, Building2, Users } from 'lucide-react'
import { SiblingSwitcher } from '../reports/ReportKit'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'
import { flagEmoji, initials, avatarColor } from './bossUtils'

/**
 * Piezas del lado Boss / admin de plataforma (rediseño 3-oct-2026, Frank:
 * «ahora falta para mí, que tengo mi cuenta Boss»): las tres páginas hermanas
 * (Panel Boss, Negocios, Owners) con el mismo lenguaje que el resto de la app.
 * Los helpers sin JSX viven en bossUtils.js.
 */

// Panel Boss ↔ Negocios ↔ Owners. Un SUPER_ADMIN sin corona no ve el panel.
export function BossSwitcher() {
  const t = useT()
  const { user } = useAuth()
  const items = [
    user?.isBoss && { to: '/boss', icon: Crown, label: 'Panel Boss', hint: 'Quién usa la app y la ruta' },
    { to: '/admin/businesses', icon: Building2, label: 'Negocios', hint: 'Cada negocio registrado' },
    { to: '/admin/owners', icon: Users, label: 'Owners', hint: 'Los dueños y cómo entran' },
  ].filter(Boolean)
  return <SiblingSwitcher items={items} label={t('Panel Boss')} />
}

// Avatar cuadrado con la bandera del negocio (`light` para ir sobre azul).
export function FlagAvatar({ code, light = false, className = '' }) {
  return (
    <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl ${
      light ? 'bg-white/20' : 'bg-blue-50'} ${className}`} aria-hidden="true">
      {flagEmoji(code)}
    </span>
  )
}

// Avatar con iniciales (`light` para ir sobre azul).
export function InitialsAvatar({ name, light = false }) {
  return (
    <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white ${
      light ? 'bg-white/20' : avatarColor(name)}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

// Píldora de dato dentro de una tarjeta (ícono + texto).
export function Chip({ icon: Icon, children, tone = 'gray' }) {
  const tones = {
    gray:    'bg-gray-100 text-gray-600',
    blue:    'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    red:     'bg-red-50 text-red-600',
  }
  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {Icon && <Icon size={11} className="flex-shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  )
}

// Tarjeta de confirmación centrada (regla de Frank: en el celular NO es hoja desde abajo).
export function ConfirmCard({ icon: Icon, tone = 'red', title, children, onClose, onConfirm, confirmLabel, pending, disabled }) {
  const t = useT()
  const danger = tone === 'red'
  return (
    <div className="fixed inset-0 z-[60] flex h-[100dvh] items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      onMouseDown={() => !pending && onClose()}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className={`flex items-start gap-3 px-5 py-4 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
          <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className={`text-base font-extrabold ${danger ? 'text-red-700' : 'text-amber-800'}`}>{title}</h3>
          </div>
        </div>
        <div className="space-y-4 px-5 py-5 text-sm text-gray-600">{children}</div>
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100">
            {t('Cancelar')}
          </button>
          <button type="button" onClick={onConfirm} disabled={disabled || pending}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-40 ${
              danger ? 'bg-red-600 shadow-red-600/30 hover:bg-red-700' : 'bg-amber-600 shadow-amber-600/30 hover:bg-amber-700'}`}>
            {pending ? t('Un momento...') : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
