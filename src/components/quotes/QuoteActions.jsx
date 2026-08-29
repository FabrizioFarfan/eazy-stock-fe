import { useState } from 'react'
import { Download, Mail, MessageCircle, Printer, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { downloadQuotePdf } from '../../utils/quotePdf'
import { shareQuoteWhatsApp, shareQuoteEmail } from '../../utils/shareQuote'
import { printQuote } from '../../utils/printQuote'
import { useT } from '../../i18n'

/**
 * Botonera de salida de una cotización: Descargar PDF · WhatsApp · Correo ·
 * Imprimir. `quote` es el objeto normalizado que entienden quotePdf/printQuote
 * (businessName, authorName, customer, items, notes, validityDays, number, createdAt).
 * `primary` marca cuál va destacada en azul (por defecto Descargar).
 */
export default function QuoteActions({ quote, primary = 'download', compact = false }) {
  const t = useT()
  const [busy, setBusy] = useState(null)

  const onDownload = () => {
    try { downloadQuotePdf(quote); toast.success(t('PDF descargado')) }
    catch { toast.error(t('No se pudo generar el PDF')) }
  }

  const onWhatsApp = async () => {
    setBusy('wa')
    try {
      const how = await shareQuoteWhatsApp(quote)
      if (how === 'desktop') {
        toast.info(t('Se descargó el PDF y se abrió WhatsApp con el mensaje listo: adjunta el archivo descargado.'), { duration: 7000 })
      }
    } catch { toast.error(t('No se pudo abrir WhatsApp')) }
    finally { setBusy(null) }
  }

  const onEmail = async () => {
    setBusy('mail')
    try {
      const how = await shareQuoteEmail(quote)
      if (how === 'desktop') {
        toast.info(t('Se descargó el PDF y se abrió tu correo con el mensaje listo: adjunta el archivo descargado.'), { duration: 7000 })
      }
    } catch { toast.error(t('No se pudo abrir el correo')) }
    finally { setBusy(null) }
  }

  const onPrint = () => {
    if (!printQuote(quote)) toast.error(t('Tu navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes.'))
  }

  const base = compact
    ? 'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold'
    : 'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold'
  const cls = (key) => `${base} ${primary === key
    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'} disabled:opacity-50`

  const noPhone = !quote.customer?.phone
  const noEmail = !quote.customer?.email
  const size = compact ? 14 : 15

  return (
    <>
      <button type="button" onClick={onDownload} className={cls('download')}>
        <Download size={size} /> {t('Descargar PDF')}
      </button>
      <button type="button" onClick={onWhatsApp} disabled={busy === 'wa'} className={cls('whatsapp')}
        title={noPhone ? t('Sin teléfono: se abre WhatsApp para que elijas el contacto') : undefined}>
        {busy === 'wa' ? <Loader2 size={size} className="animate-spin" /> : <MessageCircle size={size} />} {t('WhatsApp')}
      </button>
      <button type="button" onClick={onEmail} disabled={busy === 'mail'} className={cls('email')}
        title={noEmail ? t('Sin correo: se abre tu correo para que escribas el destinatario') : undefined}>
        {busy === 'mail' ? <Loader2 size={size} className="animate-spin" /> : <Mail size={size} />} {t('Correo')}
      </button>
      <button type="button" onClick={onPrint} className={cls('print')}>
        <Printer size={size} /> {t('Imprimir')}
      </button>
    </>
  )
}
