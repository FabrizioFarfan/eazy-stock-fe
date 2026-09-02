import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Check, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import LangSwitcher from '../i18n/LangSwitcher'

const FEATURES = [
  'Stock en vivo con alertas de mínimo y vencimiento',
  'Venta rápida con escáner y medios de pago a tu medida',
  'Fiado con recordatorio por WhatsApp',
  'Cierre de caja por medio de pago y 7 reportes',
]

export default function LoginPage() {
  const t = useT()
  const { login, token, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isLoading && token) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(
        err.response?.data?.message ??
        err.response?.data?.error ??
        t('Credenciales incorrectas'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel — desktop only */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0a0e1a] px-14 py-12 lg:flex lg:w-[52%] xl:px-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/30 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-amber-400/10 blur-[140px]" />
        </div>
        <Link to="/" className="relative flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="Eazy Stock" className="h-9 w-9 rounded-xl object-contain" />
          <span className="text-lg font-bold text-white">Eazy Stock</span>
        </Link>

        <div className="relative">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white">
            {t('Tu negocio,')}<br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-200 bg-clip-text text-transparent">{t('bajo control.')}</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-400">
            {t('Inventario, ventas, fiado y caja desde una sola pantalla. Simple, rápido y sin cuaderno.')}
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/20">
                  <Check size={11} className="text-blue-400" />
                </span>
                <span className="text-sm text-slate-300">{t(f)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Eazy Stock · {t('una app de Eazy Life Company')}
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center bg-gray-50 px-6 py-12">
        <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
          <Link to="/" className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft size={13} /> {t('Volver')}
          </Link>
          <LangSwitcher compact />
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <Link to="/" className="transition-opacity hover:opacity-80">
              <img src="/logo.png" alt="Eazy Stock" className="h-16 w-16 rounded-2xl object-contain" />
            </Link>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Eazy Stock</h2>
              <p className="mt-1 text-sm text-gray-500">{t('Ingresa a tu cuenta')}</p>
            </div>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold text-gray-900">{t('Bienvenido')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('Ingresa tus credenciales para continuar')}</p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('Correo electrónico')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('usuario@empresa.com')}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('Contraseña')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? t('Ingresando...') : t('Ingresar')}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            {t('¿Aún no tienes cuenta? Escríbenos y te la activamos gratis:')}{' '}
            <a href="mailto:kontakt.eazylife@gmail.com" className="font-semibold text-blue-600 hover:underline">kontakt.eazylife@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
