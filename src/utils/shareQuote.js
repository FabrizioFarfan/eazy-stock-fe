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
import { docPdfBlob, docPdfFileName, downloadDocPdf, DOC_KINDS, docTotals } from './quotePdf'
import { t } from '../i18n'

/** Teléfono → dígitos para wa.me, con el prefijo del país (lo legado sin "+" usa el del negocio). */
export { whatsappDigits }

/** Mensaje que acompaña al PDF (cotización o nota de pedido). */
export function docMessage(doc, kind = 'quote') {
  const { total } = docTotals(doc)
  const greet = doc.customer?.name ? t('Hola {name},', { name: doc.customer.name }) : t('Hola,')
  const vars = {
    number: DOC_KINDS[kind].numberLabel(doc),
    business: doc.businessName || t('nuestro negocio'),
    total: formatPrice(total),
  }
  if (kind === 'orderNote') {
    return `${greet} ${t('te envío la nota de pedido {number} de {business} por un total de {total}.', vars)} ${t('Adjunto el PDF con el detalle de tu compra. ¡Gracias!')}`
  }
  const validity = doc.validityDays > 0 ? ` ${t('Es válida por {n} día(s).', { n: doc.validityDays })}` : ''
  return `${greet} ${t('te envío la cotización {number} de {business} por un total de {total}.', vars)}${validity} ${t('Adjunto el PDF con el detalle. Quedo atento a cualquier consulta.')}`
}
export const quoteMessage = (quote) => docMessage(quote, 'quote')

function canShareFiles(file) {
  try { return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [file] }) }
  catch { return false }
}

/**
 * Hoja de compartir nativa con el PDF adjunto (móvil). Devuelve 'shared' si
 * se abrió, 'cancelled' si el usuario la cerró, o null si el dispositivo no
 * la soporta (entonces se usa el camino de escritorio).
 */
async function tryNativeShare(doc, kind) {
  const k = DOC_KINDS[kind]
  const file = new File([docPdfBlob(doc, kind)], docPdfFileName(doc, kind), { type: 'application/pdf' })
  if (!canShareFiles(file)) return null
  try {
    await navigator.share({ files: [file], title: `${k.name()} ${k.numberLabel(doc)}`, text: docMessage(doc, kind) })
    return 'shared'
  } catch (e) {
    return e?.name === 'AbortError' ? 'cancelled' : null
  }
}

/** @returns {'shared'|'cancelled'|'desktop'} */
export async function shareDocWhatsApp(doc, kind = 'quote') {
  const native = await tryNativeShare(doc, kind)
  if (native) return native
  downloadDocPdf(doc, kind)
  const digits = whatsappDigits(doc.customer?.phone)
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(docMessage(doc, kind))}`
  window.open(url, '_blank', 'noopener')
  return 'desktop'
}

/** @returns {'shared'|'cancelled'|'desktop'} */
export async function shareDocEmail(doc, kind = 'quote') {
  const native = await tryNativeShare(doc, kind)
  if (native) return native
  downloadDocPdf(doc, kind)
  const k = DOC_KINDS[kind]
  const to = doc.customer?.email || ''
  const subject = `${k.name()} ${k.numberLabel(doc)} — ${doc.businessName || ''}`.trim()
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(docMessage(doc, kind))}`
  return 'desktop'
}

export const shareQuoteWhatsApp = (quote) => shareDocWhatsApp(quote, 'quote')
export const shareQuoteEmail = (quote) => shareDocEmail(quote, 'quote')
export const shareOrderNoteWhatsApp = (note) => shareDocWhatsApp(note, 'orderNote')
export const shareOrderNoteEmail = (note) => shareDocEmail(note, 'orderNote')
