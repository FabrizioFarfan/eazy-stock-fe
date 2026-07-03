import { formatPrice } from './formatMoney'

/**
 * Normaliza un teléfono peruano para wa.me: solo dígitos y con código de país.
 * "987 654 321" → "51987654321". Si ya trae 51 u otro código, se respeta.
 */
export function waPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return null
  return digits.length === 9 ? `51${digits}` : digits
}

/** Recordatorio cordial de deuda — mismo tono que la carta del PDF. */
export function reminderMessage(businessName, customerName, debt) {
  const amount = formatPrice(debt)
  return (
    `Estimado(a) ${customerName}, le saludamos de ${businessName || 'nuestro negocio'}. ` +
    `Le recordamos que mantiene una deuda pendiente con nosotros por ${amount}. ` +
    `Agradecemos de antemano su puntualidad. ¡Muchas gracias!`
  )
}

/** URL de WhatsApp con el recordatorio precargado, o null si no hay teléfono. */
export function reminderWhatsAppUrl(businessName, customer) {
  const phone = waPhone(customer?.phone)
  if (!phone) return null
  const msg = reminderMessage(businessName, customer.name, customer.currentDebt)
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}
