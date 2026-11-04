// Compras y gastos → CSV (Frank, 4-nov-2026: «que le agregues datos para poderlo ver y analizar mejor»).
// Lógica pura: tres bloques (tramos, recepciones, gastos) en un solo archivo que abre Excel.

function cell(v) {
  if (v == null) return ''
  const s = String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const row = (cells) => cells.map(cell).join(';')

/**
 * @param report  PurchasesReport del API (buckets, bySupplier, byCategory, byProduct…)
 * @param receipts recepciones del período [{ createdAt, supplierName, referenceDocument, paymentMode, totalAmount }]
 * @param expenses gastos del período [{ day, concept, category, supplierName, paymentMethod, amount }]
 * @param labels   textos ya traducidos { tramo, mercaderia, otros, total, fecha, proveedor, documento, pago, monto, concepto, tipo, producto, cantidad }
 */
export function buildPurchasesCsv({ report, receipts = [], expenses = [], labels, labelOf = (b) => b.key }) {
  const L = labels
  const lines = []
  lines.push(row([L.tramo, L.mercaderia, L.otros, L.total]))
  for (const b of report?.buckets ?? []) lines.push(row([labelOf(b), num(b.purchased), num(b.expenses), num(b.total)]))
  lines.push(row([L.total, num(report?.totalPurchased), num(report?.totalExpenses), num(report?.total)]))
  lines.push('')
  lines.push(row([L.producto, L.cantidad, L.monto]))
  for (const p of report?.byProduct ?? []) lines.push(row([p.name, num(p.quantity), num(p.amount)]))
  lines.push('')
  lines.push(row([L.fecha, L.proveedor, L.documento, L.pago, L.monto]))
  for (const r of receipts) lines.push(row([(r.createdAt ?? '').slice(0, 10), r.supplierName, r.referenceDocument, r.paymentMode, num(r.totalAmount)]))
  lines.push('')
  lines.push(row([L.fecha, L.concepto, L.tipo, L.proveedor, L.pago, L.monto]))
  for (const e of expenses) lines.push(row([e.day, e.concept, e.category, e.supplierName, e.paymentMethod, num(e.amount)]))
  return '﻿' + lines.join('\n')
}

function num(v) { return v == null ? '' : Number(v).toFixed(2) }

/** Si el rango es el mes en curso, cuánto va a terminar gastando a este ritmo. null si no aplica. */
export function projectMonth({ from, to, total, today }) {
  if (!from || !to || total == null) return null
  const t = today ?? new Date()
  const first = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-01`
  const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  if (from !== first || to !== todayStr) return null
  const elapsed = t.getDate()
  const days = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  if (elapsed >= days) return null
  return { projected: Math.round(((Number(total) / elapsed) * days) * 100) / 100, elapsed, days }
}
