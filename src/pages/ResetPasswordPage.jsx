import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useT } from '../i18n'
import { usePageSeo } from './landing/site'
import { authApi } from '../services/endpoints/auth'
import { getErrorMessage, getErrorCode } from '../utils/handleApiError'
import AuthShell, { inputCls, primaryBtnCls, errorBoxCls } from '../components/common/AuthShell'

/** /restablecer?token=… (22-oct-2026): contraseña nueva ×2 con el ojito, como en el login. */
export default function ResetPasswordPage() {
  const t = useT()
  usePageSeo({ title: t('Recuperar contraseña — Eazy Stock'), description: t('Elige una contraseña nueva'), path: '/restablecer' })
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError(t('La contraseña debe tener al menos 6 caracteres'))
    if (password !== confirm) return setError(t('Las contraseñas no coinciden'))
    setSubmitting(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      if (getErrorCode(err) === 'INVALID_TOKEN') setExpired(true)
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const eyeBtn = (
    <button type="button" onClick={() => setShow((v) => !v)} tabIndex={-1}
      aria-label={show ? t('Ocultar contraseña') : t('Mostrar contraseña')}
      title={show ? t('Ocultar contraseña') : t('Mostrar contraseña')}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )

  if (!token || expired) {
    return (
      <AuthShell title={t('Este enlace ya no sirve')} subtitle={t('Los enlaces valen 1 hora y se usan una sola vez.')}>
        <div className="space-y-4 text-center">
          {error && <div className={errorBoxCls}>{error}</div>}
          <Link to="/olvide" className={`${primaryBtnCls} block text-center`}>{t('Pedir un enlace nuevo')}</Link>
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title={t('Contraseña cambiada')} subtitle={t('Ya puedes entrar con la nueva. Cerramos tus otras sesiones por seguridad.')}>
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </span>
          <Link to="/login" className={`${primaryBtnCls} block text-center`}>{t('Ingresar')}</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('Elige una contraseña nueva')} subtitle={t('Mínimo 6 caracteres. Escríbela dos veces para no equivocarte.')}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">{t('Contraseña nueva')}</label>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="new-password" autoFocus className={`${inputCls} pr-12`} />
            {eyeBtn}
          </div>
        </div>
        <div>
          <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-gray-700">{t('Repite la contraseña')}</label>
          <div className="relative">
            <input id="confirm" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••" required autoComplete="new-password" className={`${inputCls} pr-12`} />
            {eyeBtn}
          </div>
        </div>
        {error && <div className={errorBoxCls}>{error}</div>}
        <button type="submit" disabled={submitting} className={primaryBtnCls}>
          {submitting ? t('Guardando...') : t('Guardar contraseña')}
        </button>
      </form>
    </AuthShell>
  )
}
