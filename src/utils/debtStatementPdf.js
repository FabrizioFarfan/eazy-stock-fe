import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPrice } from './formatMoney'

function fmtDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(str))
}

function fmtQty(q) {
  const n = Number(q)
  return Number.isInteger(n) ? String(n) : String(n)
}

/**
 * Genera el PDF de estado de cuenta que el OWNER le entrega (impreso o por
 * WhatsApp/correo) al cliente deudor: carta cordial + detalle de compras al
 * fiado con sus productos + pagos realizados + saldo pendiente.
 *
 * `statement` = respuesta de GET /customers/{id}/statement.
 */
export function downloadDebtStatementPdf(statement) {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const marginX = 14
  let y = 18

  // ── Encabezado ──
  doc.setFontSize(15)
  doc.setFont(undefined, 'bold')
  doc.text(statement.businessName || 'Estado de cuenta', marginX, y)
  y += 6
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(110)
  doc.text(`Estado de cuenta · ${fmtDate(statement.generatedAt)}`, marginX, y)
  y += 9

  // ── Carta cordial (mismo tono que el recordatorio de WhatsApp) ──
  doc.setTextColor(30)
  doc.setFontSize(11)
  const saludo =
    `Estimado(a) ${statement.customerName}${statement.documentId ? ` (${statement.documentId})` : ''}, ` +
    `le saludamos de ${statement.businessName || 'nuestro negocio'}. ` +
    `A la fecha usted mantiene un saldo pendiente de ${formatPrice(statement.currentDebt)}. ` +
    `A continuación le presentamos el detalle de sus compras y pagos. ` +
    `Agradecemos de antemano su puntualidad.`
  const saludoLines = doc.splitTextToSize(saludo, pageW - marginX * 2)
  doc.text(saludoLines, marginX, y)
  y += saludoLines.length * 5.4 + 6

  // ── Compras al fiado (con productos) ──
  const chargeBody = []
  for (const c of statement.charges ?? []) {
    chargeBody.push([{
      content: `${fmtDate(c.date)} — ${c.description} · ${formatPrice(c.amount)}`,
      colSpan: 4,
      styles: { fontStyle: 'bold', fillColor: [243, 244, 246], textColor: [17, 24, 39] },
    }])
    for (const it of c.items ?? []) {
      chargeBody.push([
        it.productName,
        fmtQty(it.quantity),
        formatPrice(it.unitPrice),
        formatPrice(it.subtotal),
      ])
    }
  }

  if (chargeBody.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [[
        { content: 'Detalle de compras pendientes', colSpan: 4,
          styles: { halign: 'left', fillColor: [37, 99, 235] } },
      ], ['Producto', 'Cant.', 'P. unitario', 'Importe']],
      body: chargeBody,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: marginX, right: marginX },
    })
    y = doc.lastAutoTable.finalY + 7
  }

  // ── Pagos y abonos ──
  const credits = statement.credits ?? []
  if (credits.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [[
        { content: 'Pagos y abonos realizados', colSpan: 2,
          styles: { halign: 'left', fillColor: [5, 150, 105] } },
      ], ['Fecha y detalle', 'Monto']],
      body: credits.map((c) => [
        `${fmtDate(c.date)} — ${c.description}`,
        `− ${formatPrice(c.amount)}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [5, 150, 105] },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: marginX, right: marginX },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── Saldo pendiente ──
  if (y > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage()
    y = 20
  }
  doc.setFillColor(254, 242, 242)
  doc.roundedRect(marginX, y - 5, pageW - marginX * 2, 14, 2, 2, 'F')
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(153, 27, 27)
  doc.text('SALDO PENDIENTE', marginX + 4, y + 4)
  doc.text(formatPrice(statement.currentDebt), pageW - marginX - 4, y + 4, { align: 'right' })

  const safeName = (statement.customerName || 'cliente')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
  doc.save(`deuda-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
