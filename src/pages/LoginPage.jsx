import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Package, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  'Control de stock en tiempo real',
  'Alertas automáticas de bajo inventario',
  'Reportes y análisis de ventas',
  'Gestión de empleados y permisos',
]

export default function LoginPage() {
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
        'Credenciales incorrectas',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-[#0f172a] px-14 py-12 xl:px-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/40">
            <Package size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">Eazy Stock</span>
        </div>

        <div>
          <h1 className="text-5xl font-extrabold leading-tight text-white">
            Tu inventario,<br />
            <span className="text-orange-400">bajo control.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-400 max-w-md">
            Gestiona productos, ventas y proveedores desde una sola plataforma.
            Simple, rápido y sin complicaciones.
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20">
                  <Check size={11} className="text-orange-400" />
                </span>
                <span className="text-sm text-slate-300">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Eazy Stock · Todos los derechos reservados
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f172a] shadow-xl">
              <Package size={26} className="text-orange-500" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Eazy Stock</h2>
              <p className="mt-1 text-sm text-gray-500">Ingresa a tu cuenta</p>
            </div>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold text-gray-900">Bienvenido</h2>
            <p className="mt-2 text-sm text-gray-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
                className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-500/30 transition-all hover:bg-orange-600 hover:shadow-orange-500/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
