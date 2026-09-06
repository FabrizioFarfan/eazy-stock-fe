import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPrice } from './formatMoney'
import { t, dateLocale } from '../i18n'

function fmtDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(str))
}
function fmtLongDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(str))
}
/** «1 – 30 de setiembre de 2026» / «todo el historial» */
export function periodLabel(statement) {
  const { periodFrom, periodTo } = statement
  if (!periodFrom && !periodTo) return null
  const f = (d) => new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d + 'T12:00:00'))
  if (periodFrom && periodTo) return `${f(periodFrom)} – ${f(periodTo)}`
  if (periodFrom) return `${t('desde el')} ${f(periodFrom)}`
  return `${t('hasta el')} ${f(periodTo)}`
}

function fmtQty(q) {
  const n = Number(q)
  return Number.isInteger(n) ? String(n) : String(n)
}

/** Nombre de archivo estable: estado-de-cuenta-juan-perez-2026-09-07.pdf */
export function statementPdfFileName(statement) {
  const safeName = (statement.customerName || t('cliente'))
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  const when = statement.periodFrom && statement.periodTo
    ? `${statement.periodFrom}_${statement.periodTo}`
    : new Date().toISOString().slice(0, 10)
  return `${t('estado-de-cuenta')}-${safeName}-${when}.pdf`
}

/**
 * PDF de ESTADO DE CUENTA del cliente: carta cordial + el historial COMPLETO
 * de sus movimientos en orden cronológico (compras al fiado con sus productos,
 * pagos, ajustes y devoluciones) con el saldo después de cada uno, y el saldo
 * final. Es lo que el dueño le entrega (impreso, WhatsApp o correo) al cliente
 * que discute su deuda, para que cuadre su cuenta renglón por renglón
 * (pedido de William, sep-2026).
 *
 * `statement` = respuesta de GET /customers/{id}/statement.
 * @returns {jsPDF}
 */
export function buildStatementPdf(statement) {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const marginX = 14
  let y = 18
  const debt = Number(statement.closingBalance ?? statement.currentDebt ?? 0)
  const period = periodLabel(statement)
  const opening = Number(statement.openingBalance ?? 0)

  // ── Encabezado ──
  doc.setFontSize(15)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(statement.businessName || t('Estado de cuenta'), marginX, y)
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(110)
  doc.text(`${t('Estado de cuenta')} · ${fmtLongDate(statement.generatedAt)}`, pageW - marginX, y, { align: 'right' })
  if (period) {
    y += 4.5
    doc.text(`${t('Período')}: ${period}`, pageW - marginX, y, { align: 'right' })
  }
  y += 8

  // ── Cliente ──
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text(statement.customerName || t('Cliente'), marginX, y)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(110)
  const meta = [statement.documentId, statement.phone, statement.email].filter(Boolean).join(' · ')
  if (meta) { y += 4.5; doc.text(meta, marginX, y) }
  y += 8

  // ── Carta cordial ──
  doc.setTextColor(30)
  doc.setFontSize(10.5)
  const vars = {
    customer: statement.customerName,
    business: statement.businessName || t('nuestro negocio'),
    amount:   formatPrice(debt),
    period,
  }
  const saludo = period
    ? (debt > 0
      ? t('Estimado(a) {customer}, le saludamos de {business}. Le presentamos el detalle de sus compras y pagos del período {period}, partiendo del saldo que traía y con el saldo después de cada movimiento. Al cierre del período su saldo pendiente es {amount}. Agradecemos de antemano su puntualidad.', vars)
      : t('Estimado(a) {customer}, le saludamos de {business}. Le presentamos el detalle de sus compras y pagos del período {period}, partiendo del saldo que traía y con el saldo después de cada movimiento. Al cierre del período no mantiene saldo pendiente. Gracias por su preferencia.', vars))
    : (debt > 0
      ? t('Estimado(a) {customer}, le saludamos de {business}. A la fecha usted mantiene un saldo pendiente de {amount}. A continuación le presentamos el detalle completo de sus compras y pagos, con el saldo después de cada movimiento, para que pueda revisarlo con tranquilidad. Agradecemos de antemano su puntualidad.', vars)
      : t('Estimado(a) {customer}, le saludamos de {business}. A la fecha usted no mantiene saldo pendiente. A continuación le presentamos el detalle completo de sus compras y pagos, con el saldo después de cada movimiento. Gracias por su preferencia.', vars))
  const saludoLines = doc.splitTextToSize(saludo, pageW - marginX * 2)
  doc.text(saludoLines, marginX, y)
  y += saludoLines.length * 5.2 + 6

  // ── Historial cronológico ──
  const movements = statement.movements ?? []
  const body = []
  // Saldo anterior: la línea que hace que un solo mes cuadre sin arrastrar los
  // meses anteriores (saldo anterior + cargos − abonos = saldo final).
  if (period) {
    body.push([
      // El saldo anterior es el del día ANTES de que arranque el período.
      { content: statement.periodFrom ? fmtDate(new Date(new Date(statement.periodFrom + 'T12:00:00').getTime() - 86400000)) : '', styles: { textColor: [75, 85, 99] } },
      { content: t('Saldo anterior'), styles: { fontStyle: 'bold', textColor: [55, 65, 81] } },
      { content: '', styles: { fillColor: [249, 250, 251] } },
      { content: '', styles: { fillColor: [249, 250, 251] } },
      { content: formatPrice(opening), styles: { halign: 'right', fontStyle: 'bold' } },
    ])
  }
  for (const m of movements) {
    const ref = m.saleRef ? ` #${m.saleRef}` : ''
    body.push([
      { content: fmtDate(m.date), styles: { textColor: [75, 85, 99] } },
      { content: `${m.description}${ref}`, styles: { fontStyle: 'bold' } },
      { content: m.charge ? formatPrice(m.amount) : '', styles: { halign: 'right', textColor: [185, 28, 28] } },
      { content: m.charge ? '' : formatPrice(m.amount), styles: { halign: 'right', textColor: [4, 120, 87] } },
      { content: formatPrice(m.balanceAfter), styles: { halign: 'right', fontStyle: 'bold' } },
    ])
    for (const it of m.items ?? []) {
      body.push([
        { content: '', styles: { cellPadding: 0.6 } },
        { content: `   · ${fmtQty(it.quantity)} × ${it.productName} @ ${formatPrice(it.unitPrice)} = ${formatPrice(it.subtotal)}`,
          colSpan: 4, styles: { fontSize: 8, textColor: [107, 114, 128], cellPadding: { top: 0.6, bottom: 0.6, left: 2, right: 2 } } },
      ])
    }
  }

  if (movements.length === 0 && !period) {
    doc.setFontSize(10)
    doc.setTextColor(110)
    doc.text(t('Sin movimientos registrados.'), marginX, y)
    y += 10
  } else {
    autoTable(doc, {
      startY: y,
      head: [[t('Fecha'), t('Detalle'), t('Cargo'), t('Abono'), t('Saldo')]],
      body,
      foot: [[
        { content: t('Totales'), colSpan: 2, styles: { fontStyle: 'bold' } },
        { content: formatPrice(statement.totalCharges ?? 0), styles: { halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] } },
        { content: formatPrice(statement.totalCredits ?? 0), styles: { halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] } },
        { content: formatPrice(debt), styles: { halign: 'right', fontStyle: 'bold' } },
      ]],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], halign: 'left' },
      footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
      columnStyles: {
        0: { cellWidth: 22 },
        2: { cellWidth: 26, halign: 'right' },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: marginX, right: marginX },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index >= 2) data.cell.styles.halign = 'right'
      },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── Saldo final ──
  if (y > pageH - 30) { doc.addPage(); y = 20 }
  const pending = debt > 0
  doc.setFillColor(...(pending ? [254, 242, 242] : [236, 253, 245]))
  doc.roundedRect(marginX, y - 5, pageW - marginX * 2, 14, 2, 2, 'F')
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(...(pending ? [153, 27, 27] : [6, 95, 70]))
  doc.text(pending ? (period ? t('SALDO PENDIENTE AL CIERRE') : t('SALDO PENDIENTE')) : t('SIN SALDO PENDIENTE'), marginX + 4, y + 4)
  doc.text(formatPrice(debt), pageW - marginX - 4, y + 4, { align: 'right' })
  y += 16

  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(140)
  doc.text(t('El saldo de cada renglón es el que quedó justo después de ese movimiento. Cualquier diferencia, con gusto la revisamos.'), marginX, y)

  return doc
}

export function downloadDebtStatementPdf(statement) {
  buildStatementPdf(statement).save(statementPdfFileName(statement))
}

export function statementPdfBlob(statement) {
  return buildStatementPdf(statement).output('blob')
}

/**
 * Imprimir: abre el PDF en una pestaña nueva y lanza el diálogo de impresión.
 * En el celular la pestaña muestra el PDF y el usuario imprime/comparte desde
 * el visor del sistema.
 */
export function printStatementPdf(statement) {
  const url = URL.createObjectURL(statementPdfBlob(statement))
  const win = window.open(url, '_blank')
  if (!win) { downloadDebtStatementPdf(statement); return false }
  win.addEventListener?.('load', () => { try { win.focus(); win.print() } catch { /* visor sin print */ } })
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return true
}
