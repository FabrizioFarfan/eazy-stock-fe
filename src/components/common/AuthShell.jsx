import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useT } from '../../i18n'
import LangSwitcher from '../../i18n/LangSwitcher'

/**
 * Chrome de las páginas públicas de cuenta (olvidé / restablecer / verificar, 22-oct-2026):
 * el mismo panel claro del formulario del login (bg-gray-50 + tarjeta blanca, el dark mode
 * global ya los remapea), sin el panel de marca de la izquierda. Centrado y corto.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  const t = useT()
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <Link to="/login" className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
          <ArrowLeft size={13} /> {t('Volver')}
        </Link>
        <LangSwitcher compact />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="Eazy Stock" className="h-16 w-16 rounded-2xl object-contain" />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          {children}
        </div>

        {footer && <p className="mt-6 text-center text-xs text-gray-500">{footer}</p>}
      </div>
    </div>
  )
}

export const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
export const primaryBtnCls = 'w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60'
export const errorBoxCls = 'rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100'
export const okBoxCls = 'rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100'
