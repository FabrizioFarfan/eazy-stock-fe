// PDF real de la cotización (jsPDF), descargable y adjuntable. Antes solo había
// «Imprimir» (window.print) y William terminaba mandando FOTOS del papel por
// WhatsApp. Mismo contenido y mismo orden que printQuote.js: el impreso y el
// descargado se ven iguales.

import { formatPhoneDisplay } from './phone'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPrice } from './formatMoney'
import { formatQty } from './quantity'
import { t, dateLocale } from '../i18n'

const BLUE = [37, 99, 235]
const GRAY = [107, 114, 128]
const DARK = [17, 24, 39]

export const quoteNumberLabel = (number) => `COT-${String(number ?? 0).padStart(4, '0')}`

/**
 * Número de la nota de pedido de una venta. Las ventas no tienen correlativo
 * propio (se identifican por fecha y UUID), así que el número sale de la fecha
 * de la venta y los 4 primeros caracteres del id: NP-20261019-3F2A. Siempre
 * igual para la misma venta, así una reimpresión coincide con la anterior.
 */
export const orderNoteNumberLabel = (sale) => {
  const d = sale?.createdAt ? new Date(sale.createdAt) : new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const short = String(sale?.id || '').replace(/-/g, '').slice(0, 4).toUpperCase()
  return `NP-${ymd}${short ? `-${short}` : ''}`
}

const longDate = (d) => d.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Los dos documentos que salen del mismo molde (19-oct-2026, pedido de William:
 * «nota de pedido de todo lo que compró» para el cliente que no quiere factura).
 *   - quote: cotización (validez, número COT-).
 *   - orderNote: nota de pedido de una venta registrada (número NP-, pago, sin validez).
 * `number` ya viene resuelto en el objeto (quoteNumberLabel / orderNoteNumberLabel).
 */
export const DOC_KINDS = {
  quote: {
    title: () => t('COTIZACIÓN'),
    name: () => t('Cotización'),
    slug: () => t('cotizacion'),
    numberLabel: (doc) => quoteNumberLabel(doc.number),
    footer: (doc) => [
      t('Este documento es una cotización referencial y no constituye comprobante de pago.'),
      doc.validityDays > 0 ? t('Precios válidos por {n} día(s).', { n: doc.validityDays }) : '',
    ].filter(Boolean).join(' '),
  },
  orderNote: {
    title: () => t('NOTA DE PEDIDO'),
    name: () => t('Nota de pedido'),
    slug: () => t('nota-de-pedido'),
    numberLabel: (doc) => doc.number,
    footer: () => t('Esta nota de pedido detalla los productos entregados y no constituye comprobante de pago ni factura.'),
  },
}

const slugify = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()

/** Nombre de archivo estable: cotizacion-COT-0012-juan-perez.pdf / nota-de-pedido-NP-20261019-3F2A-juan-perez.pdf */
export function docPdfFileName(doc, kind = 'quote') {
  const k = DOC_KINDS[kind]
  const who = slugify(doc.customer?.name)
  return `${k.slug()}-${k.numberLabel(doc)}${who ? `-${who}` : ''}.pdf`
}
export const quotePdfFileName = (quote) => docPdfFileName(quote, 'quote')
export const orderNotePdfFileName = (note) => docPdfFileName(note, 'orderNote')

/** Total de un documento: el que trae (venta ya cobrada) o la suma de sus líneas. */
export function docTotals(doc) {
  const items = doc.items ?? []
  const lines = items.reduce((acc, it) => acc + (it.subtotal != null
    ? Number(it.subtotal) || 0
    : (Number(it.qty) || 0) * (Number(it.unitPrice) || 0)), 0)
  const discount = Number(doc.discountAmount) || 0
  const total = doc.total != null ? Number(doc.total) : lines - discount
  return { lines, discount, total }
}

/**
 * @param {object} quote  Mismo objeto que recibe printQuote:
 *   { businessName, businessTaxLabel?, authorName, customer:{name,phone,email},
 *     items:[{name,sku,unit,qty,unitPrice,subtotal?}], notes, validityDays, number, createdAt,
 *     paymentLabel?, discountAmount?, discountLabel?, total? }
 * @param {'quote'|'orderNote'} kind
 * @returns {jsPDF}
 */
export function buildDocPdf(quote, kind = 'quote') {
  const k = DOC_KINDS[kind]
  const { businessName, businessTaxLabel, authorName, customer = {}, items = [], notes = '', validityDays = 0, createdAt, paymentLabel } = quote
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const mx = 16
  let y = 20

  const created = createdAt ? new Date(createdAt) : new Date()
  const validUntil = validityDays > 0 ? new Date(created.getTime() + validityDays * 86400000) : null

  // ── Cabecera: negocio a la izquierda, documento a la derecha ──
  doc.setFont(undefined, 'bold'); doc.setFontSize(17); doc.setTextColor(...DARK)
  doc.text(businessName || t('Mi negocio'), mx, y)
  doc.setFont(undefined, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY)
  // Datos del negocio bajo el nombre: RUC (si lo tiene) y quién atendió.
  const brand = [
    businessTaxLabel || null,
    t('Atendido por {name}', { name: authorName || '—' }),
  ].filter(Boolean)
  brand.forEach((line, i) => doc.text(line, mx, y + 6 + i * 5))

  doc.setFont(undefined, 'bold'); doc.setFontSize(20); doc.setTextColor(...BLUE)
  doc.text(k.title(), pageW - mx, y, { align: 'right' })
  doc.setFont(undefined, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY)
  const meta = [
    `${t('N.°')} ${k.numberLabel(quote)}`,
    `${t('Fecha')}: ${longDate(created)}`,
    validUntil ? `${t('Válida hasta')}: ${longDate(validUntil)}` : null,
    paymentLabel ? `${t('Pago')}: ${paymentLabel}` : null,
  ].filter(Boolean)
  meta.forEach((line, i) => doc.text(line, pageW - mx, y + 6 + i * 5, { align: 'right' }))
  y += 6 + Math.max(meta.length, brand.length) * 5 + 4

  doc.setDrawColor(...BLUE); doc.setLineWidth(0.9)
  doc.line(mx, y, pageW - mx, y)
  y += 9

  // ── Cliente ──
  if (customer.name || customer.phone || customer.email) {
    doc.setFontSize(8); doc.setTextColor(156, 163, 175)
    doc.text(t('Cliente').toUpperCase(), mx, y)
    y += 5
    if (customer.name) {
      doc.setFont(undefined, 'bold'); doc.setFontSize(11.5); doc.setTextColor(...DARK)
      doc.text(customer.name, mx, y)
      y += 5.5
    }
    doc.setFont(undefined, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY)
    if (customer.phone) { doc.text(`${t('Tel')}: ${formatPhoneDisplay(customer.phone)}`, mx, y); y += 5 }
    if (customer.email) { doc.text(`${t('Correo')}: ${customer.email}`, mx, y); y += 5 }
    y += 3
  }

  // ── Líneas ──
  const { lines: linesTotal, discount, total } = docTotals(quote)
  autoTable(doc, {
    startY: y,
    head: [['#', t('Producto'), t('Cantidad'), t('Precio unit.'), t('Subtotal')]],
    body: items.map((it, i) => {
      const qty = Number(it.qty) || 0
      return [
        String(i + 1),
        it.sku ? `${it.name}\n${it.sku}` : it.name,
        `${formatQty(qty)}${it.unit ? ` ${it.unit}` : ''}`,
        formatPrice(it.unitPrice),
        formatPrice(it.subtotal != null ? it.subtotal : qty * (Number(it.unitPrice) || 0)),
      ]
    }),
    styles: { fontSize: 9.5, cellPadding: 3, textColor: DARK },
    headStyles: { fillColor: [243, 244, 246], textColor: GRAY, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, textColor: GRAY },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 32 },
      4: { halign: 'right', cellWidth: 34, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // El SKU va en gris debajo del nombre.
      if (data.section === 'body' && data.column.index === 1 && data.cell.raw?.includes('\n')) {
        data.cell.styles.fontSize = 9.5
      }
    },
    margin: { left: mx, right: mx },
  })
  y = doc.lastAutoTable.finalY + 6

  // ── Total (con subtotal y descuento cuando la venta lo tuvo) ──
  if (y > doc.internal.pageSize.getHeight() - 50) { doc.addPage(); y = 20 }
  if (discount > 0) {
    doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(...GRAY)
    doc.text(t('Subtotal'), pageW - mx - 80, y); doc.text(formatPrice(linesTotal), pageW - mx, y, { align: 'right' })
    y += 5.5
    doc.text(quote.discountLabel || t('Descuento'), pageW - mx - 80, y); doc.text(`−${formatPrice(discount)}`, pageW - mx, y, { align: 'right' })
    y += 4
  }
  doc.setDrawColor(...BLUE); doc.setLineWidth(0.7)
  doc.line(pageW - mx - 80, y, pageW - mx, y)
  y += 8
  doc.setFont(undefined, 'bold'); doc.setFontSize(13); doc.setTextColor(...DARK)
  doc.text(t('Total'), pageW - mx - 80, y)
  doc.text(formatPrice(total), pageW - mx, y, { align: 'right' })
  y += 12

  // ── Notas ──
  if (notes) {
    doc.setFont(undefined, 'normal'); doc.setFontSize(8); doc.setTextColor(156, 163, 175)
    doc.text(t('Notas').toUpperCase(), mx, y)
    y += 5
    doc.setFontSize(9.5); doc.setTextColor(55, 65, 81)
    const lines = doc.splitTextToSize(notes, pageW - mx * 2)
    doc.text(lines, mx, y)
    y += lines.length * 4.8 + 6
  }

  // ── Pie ──
  const footer = k.footer(quote)
  const pageH = doc.internal.pageSize.getHeight()
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3)
  doc.line(mx, pageH - 18, pageW - mx, pageH - 18)
  doc.setFontSize(8); doc.setTextColor(156, 163, 175)
  doc.text(doc.splitTextToSize(footer, pageW - mx * 2), pageW / 2, pageH - 13, { align: 'center' })

  return doc
}

export const buildQuotePdf = (quote) => buildDocPdf(quote, 'quote')
export const buildOrderNotePdf = (note) => buildDocPdf(note, 'orderNote')

export function downloadDocPdf(doc, kind = 'quote') {
  buildDocPdf(doc, kind).save(docPdfFileName(doc, kind))
}
export function docPdfBlob(doc, kind = 'quote') {
  return buildDocPdf(doc, kind).output('blob')
}

export const downloadQuotePdf = (quote) => downloadDocPdf(quote, 'quote')
export const quotePdfBlob = (quote) => docPdfBlob(quote, 'quote')
export const downloadOrderNotePdf = (note) => downloadDocPdf(note, 'orderNote')
export const orderNotePdfBlob = (note) => docPdfBlob(note, 'orderNote')
