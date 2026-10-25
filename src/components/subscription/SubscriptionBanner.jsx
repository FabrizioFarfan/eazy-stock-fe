import { Link } from 'react-router-dom'
import { Clock, AlertTriangle, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { useMyBusiness } from '../../hooks/useMyBusinesses'
import { useT } from '../../i18n'
import { formatDay } from './subscriptionUtils'
import { readSetupPending } from '../../utils/setupPendingNotice'
import { taxIdTrialUsedMessage } from '../../utils/taxIdText'

/**
 * Franja bajo el Topbar con el estado del plan (M1 «Planes en serio», 15-oct-2026).
 * OWNER: prueba (azul; ámbar si quedan ≤ 3 días), pago vencido (ámbar) o vencido
 * (rojo, solo lectura). EMPLOYEE: solo cuando la tienda está en solo lectura.
 * Con ACTIVE no se muestra nada.
 */
export default function SubscriptionBanner() {
  const t = useT()
  const { user } = useAuth()
  const { data: sub } = useSubscription()
  const { data: biz } = useMyBusiness({ enabled: !!user && (user.role === 'OWNER' || user.role === 'EMPLOYEE') })
  if (!sub || !user) return null

  const isOwner = user.role === 'OWNER'
  const planLink = '/settings#plan'

  // Negocio en solo lectura por el límite del plan (API 1.16.0, bajar de plan): nada se borró.
  if (biz?.planLocked && !sub.readOnly) {
    return isOwner ? (
      <Banner tone="amber" icon={Lock} to={planLink} cta={t('Ver mi plan')}>
        {t('Este negocio está en solo lectura por el límite de tu plan. Puedes verlo todo; para volver a registrar, sube de plan o elige qué negocios quedan activos.')}
      </Banner>
    ) : (
      <Banner tone="gray" icon={Lock}>{t('Este negocio está en solo lectura: el dueño debe cambiar su plan para seguir registrando.')}</Banner>
    )
  }

  if (sub.readOnly) {
    if (!isOwner) {
      return (
        <Banner tone="gray" icon={Lock}>
          {t('La tienda está en solo lectura: el dueño debe activar el plan para seguir registrando.')}
        </Banner>
      )
    }
    // Se registró con un documento que ya usó su prueba (API 1.15.0): no hubo «prueba que terminó».
    const setupPending = readSetupPending(user.businessId)
    if (setupPending) {
      return (
        <Banner tone="amber" icon={Lock} to={planLink} cta={t('Elegir plan')}>
          {taxIdTrialUsedMessage(setupPending.countryCode ?? user.countryCode)}
        </Banner>
      )
    }
    return (
      <Banner tone="red" icon={Lock} to={planLink} cta={t('Activar plan')}>
        {sub.status === 'CANCELED'
          ? t('Tu plan está cancelado: la tienda está en solo lectura. Tus datos siguen intactos.')
          : t('Tu prueba terminó: la tienda está en solo lectura. Activa un plan y sigues donde estabas.')}
      </Banner>
    )
  }

  if (!isOwner) return null

  if (sub.status === 'TRIAL') {
    const n = sub.daysLeft ?? 0
    const urgent = n <= 3
    return (
      <Banner tone={urgent ? 'amber' : 'blue'} icon={Clock} to={planLink} cta={t('Ver planes')}>
        {n <= 0
          ? t('Tu prueba gratis termina hoy.')
          : n === 1
            ? t('Prueba gratis: te queda 1 día.')
            : n > 14 && sub.trialEndsAt
              ? t('Gratis hasta el {date}: te quedan {n} días.', { date: formatDay(sub.trialEndsAt), n })
              : t('Prueba gratis: te quedan {n} días.', { n })}
        {urgent && <> {t('Activa tu plan para no quedar en solo lectura.')}</>}
      </Banner>
    )
  }

  if (sub.status === 'PAST_DUE') {
    const n = sub.daysLeft ?? 0
    return (
      <Banner tone="amber" icon={AlertTriangle} to={planLink} cta={t('Ver mi plan')}>
        {n > 0
          ? t('Tu pago venció: tienes {n} días para regularizarlo antes de que la tienda pase a solo lectura.', { n })
          : t('Tu pago venció: regularízalo hoy para que la tienda no pase a solo lectura.')}
      </Banner>
    )
  }

  return null
}

const TONES = {
  blue:  'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900',
  amber: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900',
  red:   'bg-red-50 text-red-800 border-red-100 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900',
  gray:  'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
}

function Banner({ tone, icon: Icon, to, cta, children }) {
  return (
    <div className={`flex flex-shrink-0 items-center gap-3 border-b px-4 py-2 text-xs font-medium md:px-6 ${TONES[tone]}`} role="status">
      <Icon size={14} className="flex-shrink-0" />
      <p className="min-w-0 flex-1 leading-snug">{children}</p>
      {to && (
        <Link to={to} className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1 font-bold shadow-sm hover:bg-white dark:bg-white/10 dark:hover:bg-white/20">
          {cta} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}
