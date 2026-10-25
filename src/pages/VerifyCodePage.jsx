import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, LogOut, MailCheck, RotateCcw } from 'lucide-react'
import { useT } from '../i18n'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/endpoints/auth'
import { getErrorMessage } from '../utils/handleApiError'
import { isEmailGated } from '../utils/emailGate'
import {
  CODE_LENGTH, RESEND_WAIT_S, emptyDigits, fillDigits, backspaceDigits, isComplete, retryAfterOf,
  codeErrorMessage, clearsDigits, resendState, formatCountdown, markCodeSent, readCodeSent,
} from '../utils/emailCode'
import AuthShell, { errorBoxCls, okBoxCls } from '../components/common/AuthShell'

const ROLE_HOME = { SUPER_ADMIN: '/admin/businesses', OWNER: '/dashboard', EMPLOYEE: '/sales/new' }

/**
 * /confirmar-correo (web 1.23.0 · API 1.16.0, EMAIL-CODE-SPEC.md): el dueño que se registró solo
 * no entra a nada hasta poner el código de 6 dígitos del correo. Pegar el código rellena las 6
 * casillas y la 6.ª lo envía sola; «Reenviar código» con cuenta atrás; «Cerrar sesión».
 * Fuera del AppLayout: ni menú, ni tutorial, ni WebSocket.
 */
export default function VerifyCodePage() {
  const { token, user, isLoading } = useAuth()
  if (isLoading || (token && !user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }
  if (!token) return <Navigate to="/login" replace />
  // Nunca hizo falta (o ya confirmó en otra pestaña): a su inicio. Al confirmar aquí navega el AuthContext.
  if (!isEmailGated(user)) return <Navigate to={user.isBoss ? '/boss' : ROLE_HOME[user.role] ?? '/dashboard'} replace />
  return <CodeForm user={user} />
}

function CodeForm({ user }) {
  const t = useT()
  const { verifyEmailCode, refreshUser, logout } = useAuth()
  const userKey = user?.id ?? user?.email

  const [digits, setDigits] = useState(emptyDigits)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // Si login/registro mandaron un código hace poco: solo la cuenta atrás; si no (sesión de antes
  // del 1.16.0, o pasaron los 15 min) se pide uno al abrir.
  const [initial] = useState(() => resendState(readCodeSent(userKey)))
  const [wait, setWait] = useState(initial.wait)
  const [sending, setSending] = useState(false)
  const inputs = useRef([])
  const lastTried = useRef('')
  const autoSent = useRef(false)

  const focusBox = (i) => setTimeout(() => inputs.current[i]?.focus(), 0)

  // ── Reenviar ──────────────────────────────────────────────────────────────
  const resend = useCallback(async ({ auto = false } = {}) => {
    setSending(true)
    if (!auto) { setError(''); setNotice('') }
    try {
      const r = await authApi.resendVerification()
      const body = r.data?.data ?? r.data
      markCodeSent(userKey)
      setWait(retryAfterOf(body) ?? RESEND_WAIT_S)
      setDigits(emptyDigits())
      lastTried.current = ''
      if (!auto) setNotice(t('Te mandamos un código nuevo. Revisa también el spam.'))
      focusBox(0)
    } catch (err) {
      const body = err?.response?.data
      const s = retryAfterOf(body)
      if (s) setWait(s)
      // Al abrir la pantalla, «espera N segundos» solo significa que ya hay uno en camino.
      if (auto && body?.code === 'RESEND_TOO_SOON') markCodeSent(userKey, Date.now() - (RESEND_WAIT_S - (s ?? RESEND_WAIT_S)) * 1000)
      else setError(codeErrorMessage(t, body) ?? getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }, [t, userKey])

  // StrictMode monta dos veces: el timeout cancelado evita pedir dos códigos (el 2.º anularía el 1.º).
  useEffect(() => {
    focusBox(0)
    if (!initial.autoSend || autoSent.current) return
    const id = setTimeout(() => { autoSent.current = true; resend({ auto: true }) }, 0)
    return () => clearTimeout(id)
  }, [initial, resend])

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  // Confirmó con el enlace en otra pestaña: al volver, se nota y sigue.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refreshUser({ continueIfVerified: true }) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshUser])

  // ── Enviar el código ──────────────────────────────────────────────────────
  const submit = useCallback(async (code) => {
    if (submitting) return
    lastTried.current = code
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      await verifyEmailCode(code)
    } catch (err) {
      const body = err?.response?.data
      setError(codeErrorMessage(t, body) ?? getErrorMessage(err))
      if (clearsDigits(body?.code)) {
        setDigits(emptyDigits())
        lastTried.current = ''
        focusBox(0)
      }
      setSubmitting(false)
    }
  }, [submitting, verifyEmailCode, t])

  // La 6.ª casilla (o pegar el código entero) lo envía sola, una vez por código.
  const apply = ({ digits: next, focus }) => {
    setDigits(next)
    focusBox(focus)
    const code = next.join('')
    if (isComplete(next) && code !== lastTried.current) submit(code)
  }
  const onChange = (i) => (e) => { setError(''); apply(fillDigits(digits, i, e.target.value)) }
  const onPaste = (i) => (e) => {
    const text = e.clipboardData?.getData('text') ?? ''
    if (!/\d/.test(text)) return
    e.preventDefault()
    setError('')
    apply(fillDigits(digits, i, text))
  }
  const onKeyDown = (i) => (e) => {
    if (e.key === 'Backspace') { e.preventDefault(); apply(backspaceDigits(digits, i)) }
    else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); focusBox(i - 1) }
    else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) { e.preventDefault(); focusBox(i + 1) }
    else if (e.key === 'Enter' && isComplete(digits)) { e.preventDefault(); submit(digits.join('')) }
  }

  return (
    <AuthShell title={t('Te enviamos un código a tu correo')} subtitle={t('Escríbelo aquí para entrar a tu cuenta. Vale 15 minutos.')}>
      <div className="space-y-5" data-testid="verify-code-screen">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><MailCheck size={17} /></span>
          <p className="min-w-0 break-all text-sm font-semibold text-gray-900" data-testid="verify-code-email">{user?.email}</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (isComplete(digits)) submit(digits.join('')) }}>
          <div className="flex justify-between gap-2" role="group" aria-label={t('Código de 6 dígitos')}>
            {digits.map((d, i) => (
              <input key={i} ref={(el) => { inputs.current[i] = el }}
                value={d} onChange={onChange(i)} onPaste={onPaste(i)} onKeyDown={onKeyDown(i)}
                onFocus={(e) => e.target.select()}
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={CODE_LENGTH}
                autoComplete={i === 0 ? 'one-time-code' : 'off'} disabled={submitting}
                aria-label={t('Dígito {n}', { n: i + 1 })} data-testid={`code-digit-${i}`}
                className={`h-14 w-full min-w-0 rounded-xl border text-center font-mono text-2xl font-bold text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:opacity-60 ${
                  error ? 'border-red-300' : 'border-gray-200'}`} />
            ))}
          </div>
          {submitting && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 size={14} className="animate-spin" /> {t('Comprobando...')}</p>
          )}
        </form>

        {error && <div className={errorBoxCls} role="alert" data-testid="verify-code-error">{error}</div>}
        {notice && !error && <div className={okBoxCls} role="status">{notice}</div>}

        <button type="button" onClick={() => resend()} disabled={wait > 0 || sending} data-testid="verify-code-resend"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
          {wait > 0 ? t('Reenviar código en {time}', { time: formatCountdown(wait) }) : t('Reenviar código')}
        </button>
        <p className="text-center text-xs text-gray-500">{t('¿No llega? Revisa el spam o la pestaña de promociones. También puedes tocar el botón del correo.')}</p>

        <div className="border-t border-gray-100 pt-4 text-center">
          <button type="button" onClick={logout} data-testid="verify-code-logout"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900">
            <LogOut size={14} /> {t('Cerrar sesión')}
          </button>
        </div>
      </div>
    </AuthShell>
  )
}
