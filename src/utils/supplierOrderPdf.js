// ORDEN DE PEDIDO al proveedor como PDF real (jsPDF) + envío por WhatsApp.
//
// Hasta ahora el pedido solo se «imprimía» (printSupplierOrder → window.print)
// y William tenía que guardar como PDF a mano y luego adjuntarlo; en el celular
// directamente no lograba mandarlo. Ahora, igual que las cotizaciones
// (quotePdf.js / shareQuote.js): en el celular el PDF viaja adjunto por la hoja
// de compartir del sistema; en la computadora se descarga y se abre el chat del
// proveedor con el pedido YA ESCRITO como texto (código, producto, cantidad),
// así el proveedor lo lee aunque nunca se adjunte el archivo.
//
// El documento lleva solo lo que el proveedor necesita: su código, producto,
// marca y cantidad. Nunca stock actual, mínimos ni precios.

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatQty } from './quantity'
import { whatsappDigits, formatPhoneDisplay } from './phone'
import { taxIdLabel } from './taxIdText'
import { t, dateLocale } from '../i18n'

const BLUE = [37, 99, 235]
const GRAY = [107, 114, 128]
const DARK = [17, 24, 39]

const pad = (n) => String(n).padStart(2, '0')

/** PED-20261104-1532 — el mismo número que lleva la versión impresa. */
export function supplierOrderNumber(date = new Date()) {
  return `PED-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
}

const slugify = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()

/** pedido-PED-20261104-1532-aceros-sa.pdf */
export function supplierOrderFileName(order) {
  const who = slugify(order.supplier?.name)
  return `${t('pedido')}-${order.number}${who ? `-${who}` : ''}.pdf`
}

/** Normaliza lo que arma el modal a lo que entienden el PDF, el impreso y el mensaje. */
export function makeSupplierOrder({ businessName, authorName, supplier = {}, items = [], notes = '', createdAt }) {
  const date = createdAt ? new Date(createdAt) : new Date()
  return {
    number: supplierOrderNumber(date),
    createdAt: date,
    businessName: businessName || '',
    authorName: authorName || '',
    supplier,
    items: items.map((it) => ({
      productName: it.productName,
      providerCode: it.providerCode || '',
      brand: it.brand || '',
      qty: Number(it.qty) || 0,
      unit: it.unit || '',
    })),
    notes: notes || '',
  }
}

const qtyLabel = (it) => `${formatQty(it.qty)}${it.unit ? ` ${it.unit}` : ''}`

/** @returns {jsPDF} */
export function buildSupplierOrderPdf(order) {
  const { businessName, authorName, supplier = {}, items = [], notes = '', number, createdAt } = order
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const mx = 16
  let y = 20
  const dateStr = new Date(createdAt || Date.now()).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Cabecera: negocio a la izquierda, documento a la derecha ──
  doc.setFont(undefined, 'bold'); doc.setFontSize(17); doc.setTextColor(...DARK)
  doc.text(businessName || t('Mi negocio'), mx, y)
  doc.setFont(undefined, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY)
  doc.text(`${t('Solicitado por')} ${authorName || '—'}`, mx, y + 6)

  doc.setFont(undefined, 'bold'); doc.setFontSize(20); doc.setTextColor(...BLUE)
  doc.text(t('ORDEN DE PEDIDO'), pageW - mx, y, { align: 'right' })
  doc.setFont(undefined, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY)
  doc.text(`${t('N.°')} ${number}`, pageW - mx, y + 6, { align: 'right' })
  doc.text(`${t('Fecha')}: ${dateStr}`, pageW - mx, y + 11, { align: 'right' })
  y += 18

  doc.setDrawColor(...BLUE); doc.setLineWidth(0.9)
  doc.line(mx, y, pageW - mx, y)
  y += 9

  // ── Proveedor ──
  doc.setFontSize(8); doc.setTextColor(156, 163, 175)
  doc.text(t('Proveedor').toUpperCase(), mx, y)
  y += 5
  doc.setFont(undefined, 'bold'); doc.setFontSize(11.5); doc.setTextColor(...DARK)
  doc.text(supplier.name || '—', mx, y)
  y += 5.5
  doc.setFont(undefined, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY)
  if (supplier.contact) { doc.text(`${t('Atención')}: ${supplier.contact}`, mx, y); y += 5 }
  if (supplier.phone)   { doc.text(`${t('Tel')}: ${formatPhoneDisplay(supplier.phone)}`, mx, y); y += 5 }
  if (supplier.ruc)     { doc.text(`${taxIdLabel()}: ${supplier.ruc}`, mx, y); y += 5 }
  y += 3

  doc.setFontSize(10); doc.setTextColor(55, 65, 81)
  doc.text(t('Por medio de la presente solicitamos cotización y despacho de los siguientes productos:'), mx, y)
  y += 4

  // ── Líneas: #, código del proveedor, producto, marca, cantidad ──
  autoTable(doc, {
    startY: y,
    head: [['#', t('Código proveedor'), t('Producto'), t('Marca'), t('Cantidad solicitada')]],
    body: items.map((it, i) => [String(i + 1), it.providerCode || '—', it.productName, it.brand || '—', qtyLabel(it)]),
    styles: { fontSize: 9.5, cellPadding: 3, textColor: DARK },
    headStyles: { fillColor: [243, 244, 246], textColor: GRAY, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, textColor: GRAY },
      1: { cellWidth: 36, font: 'courier' },
      3: { cellWidth: 34 },
      4: { halign: 'center', cellWidth: 36, fontStyle: 'bold' },
    },
    margin: { left: mx, right: mx },
  })
  y = doc.lastAutoTable.finalY + 5

  doc.setFont(undefined, 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY)
  doc.text(t('{n} producto(s) en este pedido', { n: items.length }), pageW - mx, y, { align: 'right' })
  y += 10

  // ── Notas ──
  if (notes) {
    if (y > pageH - 50) { doc.addPage(); y = 20 }
    doc.setFontSize(8); doc.setTextColor(156, 163, 175)
    doc.text(t('Notas').toUpperCase(), mx, y)
    y += 5
    doc.setFontSize(9.5); doc.setTextColor(55, 65, 81)
    const lines = doc.splitTextToSize(notes, pageW - mx * 2)
    doc.text(lines, mx, y)
  }

  // ── Pie ──
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3)
  doc.line(mx, pageH - 18, pageW - mx, pageH - 18)
  doc.setFontSize(8); doc.setTextColor(156, 163, 175)
  doc.text(doc.splitTextToSize(t('Orden de pedido referencial — sujeta a confirmación de disponibilidad y precios por parte del proveedor.'), pageW - mx * 2), pageW / 2, pageH - 13, { align: 'center' })
  return doc
}

export const supplierOrderPdfBlob = (order) => buildSupplierOrderPdf(order).output('blob')
export function downloadSupplierOrderPdf(order) {
  buildSupplierOrderPdf(order).save(supplierOrderFileName(order))
}

/**
 * El mensaje de WhatsApp lleva el pedido COMPLETO como texto, no solo «te
 * adjunto el PDF»: así el proveedor lo lee en el chat aunque el archivo no
 * llegue (en la computadora el navegador no puede adjuntarlo solo).
 */
export function supplierOrderMessage(order) {
  const { supplier = {}, items = [], businessName, notes, number } = order
  const greet = supplier.contact || supplier.name
    ? t('Hola {name},', { name: supplier.contact || supplier.name })
    : t('Hola,')
  const lines = items.map((it) => {
    const code = it.providerCode ? `[${it.providerCode}] ` : ''
    const brand = it.brand ? ` (${it.brand})` : ''
    return `• ${code}${it.productName}${brand} — ${qtyLabel(it)}`
  })
  const parts = [
    `${greet} ${t('te envío el pedido {number} de {business}:', { number, business: businessName || t('nuestro negocio') })}`,
    '',
    ...lines,
    '',
  ]
  if (notes) parts.push(`${t('Notas')}: ${notes}`, '')
  parts.push(t('Adjunto el PDF con el detalle. Quedo atento a la confirmación de disponibilidad y precios. ¡Gracias!'))
  return parts.join('\n')
}

function canShareFiles(file) {
  try { return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [file] }) }
  catch { return false }
}

/**
 * @returns {Promise<'shared'|'cancelled'|'desktop'>}
 *  shared    → hoja de compartir nativa con el PDF adjunto (celular).
 *  cancelled → el usuario cerró la hoja.
 *  desktop   → se descargó el PDF y se abrió wa.me con el pedido escrito.
 */
export async function shareSupplierOrderWhatsApp(order) {
  const message = supplierOrderMessage(order)
  const file = new File([supplierOrderPdfBlob(order)], supplierOrderFileName(order), { type: 'application/pdf' })
  if (canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title: `${t('Orden de pedido')} ${order.number}`, text: message })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
      // si la hoja nativa falló por otra cosa, seguimos por el camino de escritorio
    }
  }
  downloadSupplierOrderPdf(order)
  const digits = whatsappDigits(order.supplier?.phone)
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
  return 'desktop'
}
