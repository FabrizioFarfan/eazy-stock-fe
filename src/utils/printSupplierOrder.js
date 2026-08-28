// Genera la ORDEN DE PEDIDO para un proveedor en una ventana aparte y abre el
// diálogo de impresión (desde ahí "Guardar como PDF" para WhatsApp o correo).
// Es el documento que se COMPARTE con el proveedor: lleva solo lo que él
// necesita (su código, producto, marca y cantidad solicitada) — nunca el stock
// actual, el mínimo ni precios, que son información interna del negocio.
// Mismo enfoque que printQuote: HTML limpio con su propio CSS, sin librería PDF.
import { t, dateLocale, getLang } from '../i18n'

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

/**
 * @param {object} p
 * @param {string} p.businessName   Nombre de la empresa que pide.
 * @param {string} p.authorName     Quién solicita (owner o trabajador).
 * @param {{name:string, contact?:string, phone?:string, ruc?:string}} p.supplier
 * @param {Array<{productName:string, providerCode?:string, brand?:string, qty:number, unit?:string}>} p.items
 * @param {string} [p.notes]
 */
export function printSupplierOrder({ businessName, authorName, supplier = {}, items = [], notes = '' }) {
  const win = window.open('', '_blank')
  if (!win) return false

  const now = new Date()
  const orderNumber = `PED-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  const dateStr = now.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
  const e = (s) => escapeHtml(t(s))

  const rowsHtml = items.map((it, i) => `<tr>
      <td class="c muted">${i + 1}</td>
      <td class="code">${escapeHtml(it.providerCode || '—')}</td>
      <td>${escapeHtml(it.productName)}</td>
      <td>${escapeHtml(it.brand || '—')}</td>
      <td class="c strong">${escapeHtml(String(it.qty))}${it.unit ? ` ${escapeHtml(it.unit)}` : ''}</td>
    </tr>`).join('')

  win.document.write(`<!doctype html><html lang="${getLang()}"><head><meta charset="utf-8">
    <title>${e('Orden de pedido')} ${escapeHtml(orderNumber)} — ${escapeHtml(supplier.name || '')}</title>
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
      .intro { font-size: 13px; color: #374151; margin: 0 0 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
      thead th { background: #f3f4f6; text-align: left; padding: 10px 12px; font-size: 10px;
                 text-transform: uppercase; letter-spacing: .04em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
      tbody td { padding: 10px 12px; border-bottom: 1px solid #f0f1f3; vertical-align: top; }
      td.c, th.c { text-align: center; }
      td.strong { font-weight: 700; } td.muted { color: #9ca3af; }
      td.code { font-family: monospace; font-size: 12px; color: #374151; }
      .count { margin-top: 12px; font-size: 12px; color: #6b7280; text-align: right; }
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
          <p>${e('Solicitado por')} ${escapeHtml(authorName || '—')}</p>
        </div>
        <div class="doc">
          <p class="title">${e('ORDEN DE PEDIDO')}</p>
          <p class="meta">${e('N.°')} <strong>${escapeHtml(orderNumber)}</strong></p>
          <p class="meta">${e('Fecha')}: <strong>${escapeHtml(dateStr)}</strong></p>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <p class="label">${e('Proveedor')}</p>
          <p class="value">${escapeHtml(supplier.name || '—')}</p>
          ${supplier.contact ? `<p class="sub">${e('Atención')}: ${escapeHtml(supplier.contact)}</p>` : ''}
          ${supplier.phone ? `<p class="sub">Tel: ${escapeHtml(supplier.phone)}</p>` : ''}
          ${supplier.ruc ? `<p class="sub">RUC: ${escapeHtml(supplier.ruc)}</p>` : ''}
        </div>
      </div>

      <p class="intro">${e('Por medio de la presente solicitamos cotización y despacho de los siguientes productos:')}</p>

      <table>
        <thead><tr>
          <th class="c">#</th><th>${e('Código proveedor')}</th><th>${e('Producto')}</th><th>${e('Marca')}</th><th class="c">${e('Cantidad solicitada')}</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p class="count">${escapeHtml(t('{n} producto(s) en este pedido', { n: items.length }))}</p>

      ${notes ? `<div class="notes"><p class="label">${e('Notas')}</p><p>${escapeHtml(notes).replace(/\n/g, '<br>')}</p></div>` : ''}

      <div class="foot">
        ${e('Orden de pedido referencial — sujeta a confirmación de disponibilidad y precios por parte del proveedor.')}
      </div>
    </div>
  </body></html>`)
  win.document.close()
  win.focus()
  win.print()
  return true
}
