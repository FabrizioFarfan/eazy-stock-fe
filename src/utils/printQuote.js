// Genera un documento de cotización profesional en una ventana aparte y abre el
// diálogo de impresión (desde ahí el usuario puede "Guardar como PDF" para
// enviarlo por WhatsApp o correo). No usamos librería de PDF: armamos un HTML
// limpio con su propio CSS, así no tocamos los estilos de la app.

import { formatPhoneDisplay } from './phone'
import { formatPrice } from './formatMoney'
import { DOC_KINDS, docTotals } from './quotePdf'
import { t, dateLocale, getLang } from '../i18n'

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

function money(v) {
  const n = Number(v) || 0
  return formatPrice(n) // moneda del negocio
}

/**
 * @param {object} p
 * @param {string} p.businessName   Nombre de la empresa.
 * @param {string} [p.businessTaxLabel]  «RUC 20123456789» si el negocio lo tiene.
 * @param {string} p.authorName     Quién hace la cotización (owner o trabajador).
 * @param {{name?:string, phone?:string}} p.customer  Datos opcionales del cliente.
 * @param {Array<{name:string, sku?:string, unit?:string, qty:number, unitPrice:number, subtotal?:number}>} p.items
 * @param {string} [p.notes]
 * @param {number} [p.validityDays]
 * @param {string} [p.paymentLabel]   Nota de pedido: cómo pagó (Efectivo / Yape / al fiado).
 * @param {number} [p.discountAmount] Nota de pedido: descuento de la venta, si lo hubo.
 * @param {number} [p.total]          Nota de pedido: total cobrado (manda sobre la suma de líneas).
 * @param {'quote'|'orderNote'} [kind]
 */
export function printDoc(p, kind = 'quote') {
  const { businessName, businessTaxLabel, authorName, customer = {}, items = [], notes = '', validityDays = 7, number = null, createdAt = null, paymentLabel, discountLabel } = p
  const k = DOC_KINDS[kind]
  const win = window.open('', '_blank')
  if (!win) return false

  // Cotización guardada: sale con su correlativo del negocio (COT-0012) y la
  // fecha en que se hizo, así la reimpresión desde el historial es idéntica.
  const now = createdAt ? new Date(createdAt) : new Date()
  const quoteNumber = kind !== 'quote'
    ? k.numberLabel(p)
    : number != null
      ? `COT-${String(number).padStart(4, '0')}`
      : `COT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  const dateStr = now.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })

  let validUntilStr = ''
  if (kind === 'quote' && validityDays > 0) {
    const until = new Date(now.getTime() + validityDays * 86400000)
    validUntilStr = until.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const { lines: linesTotal, discount, total } = docTotals(p)

  const rowsHtml = items.map((it, i) => {
    const qty = Number(it.qty) || 0
    const subtotal = it.subtotal != null ? Number(it.subtotal) : qty * (Number(it.unitPrice) || 0)
    return `<tr>
      <td class="c muted">${i + 1}</td>
      <td>${escapeHtml(it.name)}${it.sku ? `<div class="sku">${escapeHtml(it.sku)}</div>` : ''}</td>
      <td class="c">${qty}${it.unit ? ` ${escapeHtml(it.unit)}` : ''}</td>
      <td class="r">${money(it.unitPrice)}</td>
      <td class="r strong">${money(subtotal)}</td>
    </tr>`
  }).join('')

  const customerBlock = (customer.name || customer.phone)
    ? `<div class="party">
         <p class="label">${escapeHtml(t('Cliente'))}</p>
         ${customer.name ? `<p class="value">${escapeHtml(customer.name)}</p>` : ''}
         ${customer.phone ? `<p class="sub">${escapeHtml(t('Tel'))}: ${escapeHtml(formatPhoneDisplay(customer.phone))}</p>` : ''}
       </div>`
    : ''

  win.document.write(`<!doctype html><html lang="${getLang()}"><head><meta charset="utf-8">
    <title>${escapeHtml(k.name())} ${escapeHtml(quoteNumber)}</title>
    <style>
      * { box-sizing: border-box; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; }
      body { margin: 0; color: #1f2937; }
      .page { max-width: 800px; margin: 0 auto; padding: 40px; }
      .top { display: flex; justify-content: space-between; align-items: flex-start;
             border-bottom: 3px solid #2563eb; padding-bottom: 16px; }
      .brand h1 { font-size: 22px; margin: 0; color: #111827; }
      .brand p { margin: 2px 0 0; font-size: 12px; color: #6b7280; }
      .doc { text-align: right; }
      .doc .title { font-size: 26px; font-weight: 800; color: #2563eb; letter-spacing: .04em; margin: 0; }
      .doc .meta { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
      .doc .meta strong { color: #111827; }
      .parties { display: flex; justify-content: space-between; gap: 24px; margin: 24px 0; }
      .party .label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; margin: 0 0 2px; }
      .party .value { font-size: 14px; font-weight: 600; margin: 0; }
      .party .sub { font-size: 12px; color: #6b7280; margin: 2px 0 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
      thead th { background: #f3f4f6; text-align: left; padding: 10px 12px; font-size: 10px;
                 text-transform: uppercase; letter-spacing: .04em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
      tbody td { padding: 10px 12px; border-bottom: 1px solid #f0f1f3; vertical-align: top; }
      td.c, th.c { text-align: center; } td.r, th.r { text-align: right; }
      td.strong { font-weight: 700; } td.muted { color: #9ca3af; }
      .sku { font-family: monospace; font-size: 11px; color: #9ca3af; margin-top: 2px; }
      .totals { display: flex; justify-content: flex-end; margin-top: 16px; }
      .totals .box { min-width: 240px; }
      .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
      .totals .grand { border-top: 2px solid #2563eb; margin-top: 4px; padding-top: 10px;
                       font-size: 18px; font-weight: 800; color: #111827; }
      .notes { margin-top: 24px; font-size: 12px; color: #374151; }
      .notes .label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; margin: 0 0 4px; }
      .foot { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb;
              font-size: 11px; color: #9ca3af; text-align: center; }
      @media print { .page { padding: 24px; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="page">
      <div class="top">
        <div class="brand">
          <h1>${escapeHtml(businessName || t('Mi negocio'))}</h1>
          ${businessTaxLabel ? `<p>${escapeHtml(businessTaxLabel)}</p>` : ''}
          <p>${escapeHtml(t('Atendido por {name}', { name: authorName || '—' }))}</p>
        </div>
        <div class="doc">
          <p class="title">${escapeHtml(k.title())}</p>
          <p class="meta">${escapeHtml(t('N.°'))} <strong>${escapeHtml(quoteNumber)}</strong></p>
          <p class="meta">${escapeHtml(t('Fecha'))}: <strong>${escapeHtml(dateStr)}</strong></p>
          ${validUntilStr ? `<p class="meta">${escapeHtml(t('Válida hasta'))}: <strong>${escapeHtml(validUntilStr)}</strong></p>` : ''}
          ${paymentLabel ? `<p class="meta">${escapeHtml(t('Pago'))}: <strong>${escapeHtml(paymentLabel)}</strong></p>` : ''}
        </div>
      </div>

      <div class="parties">
        ${customerBlock || '<div></div>'}
      </div>

      <table>
        <thead><tr>
          <th class="c">#</th><th>${escapeHtml(t('Producto'))}</th><th class="c">${escapeHtml(t('Cantidad'))}</th>
          <th class="r">${escapeHtml(t('Precio unit.'))}</th><th class="r">${escapeHtml(t('Subtotal'))}</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="totals"><div class="box">
        ${discount > 0 ? `<div class="row"><span>${escapeHtml(t('Subtotal'))}</span><span>${money(linesTotal)}</span></div>
        <div class="row"><span>${escapeHtml(discountLabel || t('Descuento'))}</span><span>−${money(discount)}</span></div>` : ''}
        <div class="row grand"><span>${escapeHtml(t('Total'))}</span><span>${money(total)}</span></div>
      </div></div>

      ${notes ? `<div class="notes"><p class="label">${escapeHtml(t('Notas'))}</p><p>${escapeHtml(notes).replace(/\n/g, '<br>')}</p></div>` : ''}

      <div class="foot">${escapeHtml(k.footer(p))}</div>
    </div>
  </body></html>`)
  win.document.close()
  win.focus()
  win.print()
  return true
}

export const printQuote = (quote) => printDoc(quote, 'quote')
export const printOrderNote = (note) => printDoc(note, 'orderNote')
