import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Apple, Check, Heart, Loader2, Smartphone, Sparkles, Zap } from 'lucide-react'
import { useT } from '../../i18n'
import { track } from '../../analytics/track'
import { getErrorMessage } from '../../utils/handleApiError'
import api from '../../services/api'
import { Reveal } from './shared'

/**
 * Apps en fase de prueba (Frank, 7-nov-2026): quien entra cree que no hay apps y se desanima, y para publicar en
 * Play nos faltan testers. Se cuenta tal cual, como un favor que se agradece: deja tu correo y te invitamos.
 * Lo enseñan el Inicio y /apps. El beneficio también sale en el correo de AppTesterService: cambiar los dos.
 */
const PERKS = [
  [Zap, 'Usas la app antes que nadie, gratis.'],
  [Sparkles, '3 meses gratis del plan Pro cuando salga.'],
  [Heart, 'Hablas directo con quienes la hacemos.'],
]

function PhoneMock() {
  const t = useT()
  return (
    <div aria-hidden="true" className="mx-auto w-[15.5rem] rounded-[2.4rem] border border-white/15 bg-[#05070d] p-2.5 shadow-2xl shadow-blue-900/40">
      <div className="overflow-hidden rounded-[1.9rem] bg-gray-50 text-left">
        <div className="bg-blue-600 px-4 pb-4 pt-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">{t('Vendido hoy')}</p>
          <p className="mt-0.5 font-mono text-2xl font-extrabold">S/ 2,580.50</p>
          <p className="mt-1 text-[11px] text-blue-100">{t('18 ventas · +18 % que ayer')}</p>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white">
            {t('Nueva venta')} <span>+</span>
          </div>
          {[['Pegamento PVC 1/4 gal', '3 / 10'], ['Clavos 2" (kg)', '4 / 20'], ['Cinta aislante', '6 / 15']].map(([name, stock]) => (
            <div key={name} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-[11px] shadow-sm ring-1 ring-gray-100">
              <span className="truncate font-semibold text-gray-800">{t(name)}</span>
              <span className="flex-shrink-0 font-mono font-bold text-amber-600">{stock}</span>
            </div>
          ))}
          <p className="pt-1 text-center text-[10px] font-semibold text-gray-400">{t('Escanea, cobra y mira tu stock')}</p>
        </div>
      </div>
    </div>
  )
}

export default function AppsTesters() {
  const t = useT()
  const [platform, setPlatform] = useState('ANDROID')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError(t('Escribe un correo válido.')); return }
    setSending(true)
    setError('')
    try {
      await api.post('/public/app-testers', { email: email.trim(), platform, website })
      track('click', { label: `tester_signup_${platform.toLowerCase()}` })
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="apps" className="relative scroll-mt-20 overflow-hidden bg-[#0a0e1a] py-20 sm:py-28" data-testid="apps-testers">
      <div aria-hidden className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Reveal>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> {t('Android y iPhone · en fase de prueba')}
          </p>
          <h2 className="lp-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            {t('La app ya funciona.')}<br />
            <span className="text-slate-400">{t('Nos faltan personas para probarla.')}</span>
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
            {t('Para publicarla, Google nos pide gente real que la use durante 14 días, y somos un equipo pequeño. ¿Nos echas una mano? Te lo agradecemos de verdad.')}
          </p>
          <ul className="mt-5 space-y-2">
            {PERKS.map(([Icon, text]) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-slate-200">
                <Icon size={16} className="mt-0.5 flex-shrink-0 text-blue-400" /> {t(text)}
              </li>
            ))}
          </ul>

          {done ? (
            <div className="mt-7 flex max-w-xl items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100" role="status" data-testid="tester-done">
              <Check size={18} className="mt-0.5 flex-shrink-0 text-emerald-300" />
              <p><strong className="font-bold">{t('¡Gracias! Ya estás en la lista.')}</strong> {t('Te escribimos con el enlace en cuanto te demos acceso.')}</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-7 max-w-xl">
              <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('Tu teléfono')}>
                {[['ANDROID', 'Android', Smartphone], ['IOS', 'iPhone', Apple]].map(([key, label, Icon]) => (
                  <button key={key} type="button" role="radio" aria-checked={platform === key} onClick={() => setPlatform(key)} data-testid={`tester-${key.toLowerCase()}`}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      platform === key ? 'border-blue-400 bg-blue-500/20 text-white' : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="tester-email" className="sr-only">{t('Tu correo')}</label>
                <input id="tester-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="tester-email"
                  placeholder={platform === 'IOS' ? t('El correo de tu cuenta de Apple') : t('El correo de tu cuenta de Google')}
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-400" />
                {/* Campo trampa: las personas no lo ven; los bots lo rellenan. */}
                <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" className="hidden" />
                <button type="submit" disabled={sending} data-testid="tester-submit"
                  className="lp-btn-3d flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
                  {sending && <Loader2 size={15} className="animate-spin" />} {t('Quiero probarla')}
                </button>
              </div>
              {error && <p className="mt-2 text-sm text-red-300" data-testid="tester-error">{error}</p>}
              <p className="mt-2.5 text-xs text-slate-400">
                {t('Te llega el acceso a ese correo. Solo lo usamos para esto;')}{' '}
                <Link to="/datenschutz" className="underline hover:text-white">{t('puedes pedirnos que lo borremos')}</Link>.
              </p>
            </form>
          )}
        </Reveal>
        <Reveal delay={120}><PhoneMock /></Reveal>
      </div>
    </section>
  )
}
