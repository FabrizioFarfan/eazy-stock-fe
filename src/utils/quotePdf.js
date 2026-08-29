// PDF real de la cotización (jsPDF), descargable y adjuntable. Antes solo había
// «Imprimir» (window.print) y William terminaba mandando FOTOS del papel por
// WhatsApp. Mismo contenido y mismo orden que printQuote.js: el impreso y el
// descargado se ven iguales.

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPrice } from './formatMoney'
import { formatQty } from './quantity'
import { t, dateLocale } from '../i18n'

const BLUE = [37, 99, 235]
const GRAY = [107, 114, 128]
const DARK = [17, 24, 39]

export const quoteNumberLabel = (number) => `COT-${String(number ?? 0).padStart(4, '0')}`

const longDate = (d) => d.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })

/** Nombre de archivo estable: cotizacion-COT-0012-juan-perez.pdf */
export function quotePdfFileName(quote) {
  const who = (quote.customer?.name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  return `${t('cotizacion')}-${quoteNumberLabel(quote.number)}${who ? `-${who}` : ''}.pdf`
}

/**
 * @param {object} quote  Mismo objeto que recibe printQuote:
 *   { businessName, authorName, customer:{name,phone,email}, items:[{name,sku,unit,qty,unitPrice}],
 *     notes, validityDays, number, createdAt }
 * @returns {jsPDF}
 */
export function buildQuotePdf(quote) {
  const { businessName, authorName, customer = {}, items = [], notes = '', validityDays = 0, number, createdAt } = quote
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
  doc.text(t('Atendido por {name}', { name: authorName || '—' }), mx, y + 6)

  doc.setFont(undefined, 'bold'); doc.setFontSize(20); doc.setTextColor(...BLUE)
  doc.text(t('COTIZACIÓN'), pageW - mx, y, { align: 'right' })
  doc.setFont(undefined, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY)
  const meta = [
    `${t('N.°')} ${quoteNumberLabel(number)}`,
    `${t('Fecha')}: ${longDate(created)}`,
    validUntil ? `${t('Válida hasta')}: ${longDate(validUntil)}` : null,
  ].filter(Boolean)
  meta.forEach((line, i) => doc.text(line, pageW - mx, y + 6 + i * 5, { align: 'right' }))
  y += 6 + meta.length * 5 + 4

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
    if (customer.phone) { doc.text(`${t('Tel')}: ${customer.phone}`, mx, y); y += 5 }
    if (customer.email) { doc.text(`${t('Correo')}: ${customer.email}`, mx, y); y += 5 }
    y += 3
  }

  // ── Líneas ──
  const total = items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0)
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
        formatPrice(qty * (Number(it.unitPrice) || 0)),
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

  // ── Total ──
  if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20 }
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
  const footer = [
    t('Este documento es una cotización referencial y no constituye comprobante de pago.'),
    validityDays > 0 ? t('Precios válidos por {n} día(s).', { n: validityDays }) : '',
  ].filter(Boolean).join(' ')
  const pageH = doc.internal.pageSize.getHeight()
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3)
  doc.line(mx, pageH - 18, pageW - mx, pageH - 18)
  doc.setFontSize(8); doc.setTextColor(156, 163, 175)
  doc.text(doc.splitTextToSize(footer, pageW - mx * 2), pageW / 2, pageH - 13, { align: 'center' })

  return doc
}

export function downloadQuotePdf(quote) {
  buildQuotePdf(quote).save(quotePdfFileName(quote))
}

export function quotePdfBlob(quote) {
  return buildQuotePdf(quote).output('blob')
}
