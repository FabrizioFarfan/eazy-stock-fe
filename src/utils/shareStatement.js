// Enviar el ESTADO DE CUENTA del cliente por WhatsApp o correo. Mismo
// mecanismo que las cotizaciones (shareQuote.js): en el celular, hoja de
// compartir nativa con el PDF adjunto; en escritorio, se descarga el PDF y se
// abre el chat / el correo con el mensaje listo para adjuntarlo.

import { formatPrice } from './formatMoney'
import { whatsappDigits } from './phone'
import { statementPdfBlob, statementPdfFileName, downloadDebtStatementPdf, periodLabel } from './debtStatementPdf'
import { t } from '../i18n'

export function statementMessage(statement) {
  const debt = Number(statement.closingBalance ?? statement.currentDebt ?? 0)
  const greet = statement.customerName ? t('Hola {name},', { name: statement.customerName }) : t('Hola,')
  const business = statement.businessName || t('nuestro negocio')
  const period = periodLabel(statement)
  const body = period
    ? (debt > 0
      ? t('te envío tu estado de cuenta de {business} del período {period}: al cierre tu saldo pendiente es {amount}.', { business, period, amount: formatPrice(debt) })
      : t('te envío tu estado de cuenta de {business} del período {period}: al cierre no tienes saldo pendiente.', { business, period }))
    : (debt > 0
      ? t('te envío tu estado de cuenta de {business}: a la fecha tu saldo pendiente es {amount}.', { business, amount: formatPrice(debt) })
      : t('te envío tu estado de cuenta de {business}: a la fecha no tienes saldo pendiente.', { business }))
  return `${greet} ${body} ${t('Adjunto el PDF con el detalle de tus compras y pagos, con el saldo después de cada movimiento, para que lo revises. Cualquier diferencia me avisas y la vemos juntos.')}`
}

function canShareFiles(file) {
  try { return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [file] }) }
  catch { return false }
}

async function tryNativeShare(statement) {
  const file = new File([statementPdfBlob(statement)], statementPdfFileName(statement), { type: 'application/pdf' })
  if (!canShareFiles(file)) return null
  try {
    await navigator.share({ files: [file], title: `${t('Estado de cuenta')} · ${statement.customerName ?? ''}`.trim(), text: statementMessage(statement) })
    return 'shared'
  } catch (e) {
    return e?.name === 'AbortError' ? 'cancelled' : null
  }
}

/** @returns {'shared'|'cancelled'|'desktop'} */
export async function shareStatementWhatsApp(statement) {
  const native = await tryNativeShare(statement)
  if (native) return native
  downloadDebtStatementPdf(statement)
  const digits = whatsappDigits(statement.phone)
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(statementMessage(statement))}`, '_blank', 'noopener')
  return 'desktop'
}

/** @returns {'shared'|'cancelled'|'desktop'} */
export async function shareStatementEmail(statement) {
  const native = await tryNativeShare(statement)
  if (native) return native
  downloadDebtStatementPdf(statement)
  const to = statement.email || ''
  const subject = `${t('Estado de cuenta')} — ${statement.businessName || ''}`.trim()
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(statementMessage(statement))}`
  return 'desktop'
}
