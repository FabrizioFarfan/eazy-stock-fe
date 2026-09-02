import { whatsappDigits } from './phone'
import { formatPrice } from './formatMoney'
import { t } from '../i18n'

/**
 * Teléfono → dígitos con prefijo para wa.me ("51987654321"). Lo guardado sin
 * "+" (los 9 dígitos de siempre) toma el prefijo del país del negocio.
 */
export function waPhone(phone) {
  return whatsappDigits(phone) || null
}

/** Recordatorio cordial de deuda — mismo tono que la carta del PDF. */
export function reminderMessage(businessName, customerName, debt) {
  const amount = formatPrice(debt)
  return t(
    'Estimado(a) {customer}, le saludamos de {business}. Le recordamos que mantiene una deuda pendiente con nosotros por {amount}. Agradecemos de antemano su puntualidad. ¡Muchas gracias!',
    { customer: customerName, business: businessName || t('nuestro negocio'), amount },
  )
}

/** URL de WhatsApp con el recordatorio precargado, o null si no hay teléfono. */
export function reminderWhatsAppUrl(businessName, customer) {
  const phone = waPhone(customer?.phone)
  if (!phone) return null
  const msg = reminderMessage(businessName, customer.name, customer.currentDebt)
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}
