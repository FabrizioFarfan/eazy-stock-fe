// Helpers de la suscripción (M1 «Planes en serio», 15-oct-2026), fuera de los
// componentes por la regla react-refresh.
import { dateLocale } from '../../i18n'

/** Key de plans.js (minúscula) ↔ plan del BE (mayúscula). */
export const planKey = (plan) => (plan ? String(plan).toLowerCase() : null)

/** Enlace de WhatsApp a Eazy Life con el texto prellenado para activar o pagar. */
export function whatsappActivateLink({ businessName, plan, t }) {
  const text = t('Hola, soy de {business}. Quiero activar el plan {plan} de Eazy Stock.', { business: businessName ?? '', plan: plan ?? 'Basic' })
  return `https://wa.me/4915511384643?text=${encodeURIComponent(text)}`
}

export const SUPPORT_EMAIL = 'kontakt.eazylife@gmail.com'
export const SUPPORT_PHONE_DISPLAY = '+49 155 11384643'

export function formatDay(str) {
  if (!str) return '—'
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

/** Tono visual por estado. */
export const STATUS_TONE = {
  TRIAL:     'blue',
  ACTIVE:    'emerald',
  PAST_DUE:  'amber',
  EXPIRED:   'red',
  CANCELED:  'gray',
}

export const STATUS_LABEL = {
  TRIAL:    'En prueba',
  ACTIVE:   'Activo',
  PAST_DUE: 'Pago vencido',
  EXPIRED:  'Vencido',
  CANCELED: 'Cancelado',
}
