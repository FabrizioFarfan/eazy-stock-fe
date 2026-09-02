// Enviar la cotización por WhatsApp o correo.
//
// En el CELULAR (Android/iOS con Web Share API y archivos) el PDF viaja
// adjunto de una: se abre la hoja de compartir del sistema con el archivo ya
// puesto y el usuario elige WhatsApp / Gmail / lo que sea.
//
// En ESCRITORIO el navegador no puede meter un archivo en WhatsApp Web ni en
// el cliente de correo, así que se hace lo más cercano: se DESCARGA el PDF y
// se abre el chat / el correo con el mensaje ya escrito; solo queda adjuntar
// (arrastrar) el archivo descargado. Ambos caminos devuelven cuál se usó para
// que la pantalla avise lo que corresponde.

import { formatPrice } from './formatMoney'
import { whatsappDigits } from './phone'
import { quotePdfBlob, quotePdfFileName, downloadQuotePdf, quoteNumberLabel } from './quotePdf'
import { t } from '../i18n'

/** Teléfono → dígitos para wa.me, con el prefijo del país (lo legado sin "+" usa el del negocio). */
export { whatsappDigits }

export function quoteMessage(quote) {
  const total = (quote.items ?? []).reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0)
  const greet = quote.customer?.name ? t('Hola {name},', { name: quote.customer.name }) : t('Hola,')
  const validity = quote.validityDays > 0 ? ` ${t('Es válida por {n} día(s).', { n: quote.validityDays })}` : ''
  return `${greet} ${t('te envío la cotización {number} de {business} por un total de {total}.', {
    number: quoteNumberLabel(quote.number),
    business: quote.businessName || t('nuestro negocio'),
    total: formatPrice(total),
  })}${validity} ${t('Adjunto el PDF con el detalle. Quedo atento a cualquier consulta.')}`
}

function canShareFiles(file) {
  try { return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [file] }) }
  catch { return false }
}

/**
 * Hoja de compartir nativa con el PDF adjunto (móvil). Devuelve 'shared' si
 * se abrió, 'cancelled' si el usuario la cerró, o null si el dispositivo no
 * la soporta (entonces se usa el camino de escritorio).
 */
async function tryNativeShare(quote) {
  const file = new File([quotePdfBlob(quote)], quotePdfFileName(quote), { type: 'application/pdf' })
  if (!canShareFiles(file)) return null
  try {
    await navigator.share({ files: [file], title: `${t('Cotización')} ${quoteNumberLabel(quote.number)}`, text: quoteMessage(quote) })
    return 'shared'
  } catch (e) {
    return e?.name === 'AbortError' ? 'cancelled' : null
  }
}

/** @returns {'shared'|'cancelled'|'desktop'} */
export async function shareQuoteWhatsApp(quote) {
  const native = await tryNativeShare(quote)
  if (native) return native
  downloadQuotePdf(quote)
  const digits = whatsappDigits(quote.customer?.phone)
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(quoteMessage(quote))}`
  window.open(url, '_blank', 'noopener')
  return 'desktop'
}

/** @returns {'shared'|'cancelled'|'desktop'} */
export async function shareQuoteEmail(quote) {
  const native = await tryNativeShare(quote)
  if (native) return native
  downloadQuotePdf(quote)
  const to = quote.customer?.email || ''
  const subject = `${t('Cotización')} ${quoteNumberLabel(quote.number)} — ${quote.businessName || ''}`.trim()
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(quoteMessage(quote))}`
  return 'desktop'
}
