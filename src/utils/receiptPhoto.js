// «Recibir mercadería con fotos» (Frank, 22-nov-2026): la foto de la factura, la guía o el cuaderno → una recepción
// lista para revisar. Aquí vive la lógica de la revisión, sin React, para poder probarla.
import { parseNumber, PHOTO_UNITS } from './photoLoad.js'

/**
 * Qué se hace con cada línea leída:
 *   match → es este producto del catálogo
 *   pick  → hay parecidos pero ninguno claro: la persona tiene que decir cuál (o que es nuevo, o saltarla)
 *   new   → no está en el catálogo: se crea con este nombre
 *   skip  → no entra en la recepción
 */
export function toReceiptRows(lines = []) {
  return lines.map((l) => {
    const candidates = [...(l.match ? [l.match] : []), ...(l.candidates ?? [])]
    return {
      key: l.ref,
      readName: l.name ?? '',
      code: l.code ?? '',
      mode: l.match ? 'match' : candidates.length > 0 ? 'pick' : 'new',
      product: l.match ?? null,
      candidates,
      newName: l.name ?? '',
      unit: PHOTO_UNITS.includes(l.unit) ? l.unit : 'unidad',
      qty: l.quantity != null ? String(l.quantity) : '',
      cost: l.unitCost != null ? String(l.unitCost) : '',
      confidence: l.confidence ?? 'MEDIUM',
      photo: l.photo ?? 1,
    }
  })
}

const round2 = (n) => Math.round(n * 100) / 100

/**
 * Qué va a pasar y qué falta. `problems` = { [key]: 'PICK' | 'NAME' | 'QTY' | 'COST' | 'DUPLICATE' }:
 * falta decir cuál es, falta el nombre del nuevo, la cantidad no es un número mayor que cero, el costo no es un
 * número, o dos productos nuevos se llaman igual. El costo puede ir vacío: se pone después, en la recepción.
 */
export function receiptSummary(rows) {
  const problems = {}
  let lines = 0
  let toCreate = 0
  let total = 0
  const newNames = new Set()
  for (const r of rows) {
    if (r.mode === 'skip') continue
    lines += 1
    const qty = parseNumber(r.qty)
    const cost = r.cost.trim() === '' ? 0 : parseNumber(r.cost)
    if (r.mode === 'pick') problems[r.key] = 'PICK'
    else if (r.mode === 'new' && r.newName.replace(/\s+/g, '') === '') problems[r.key] = 'NAME'
    else if (r.mode === 'new' && newNames.has(r.newName.replace(/\s+/g, '').toLowerCase())) problems[r.key] = 'DUPLICATE'
    else if (qty == null || qty <= 0) problems[r.key] = 'QTY'
    else if (cost == null) problems[r.key] = 'COST'
    if (r.mode === 'new') {
      toCreate += 1
      newNames.add(r.newName.replace(/\s+/g, '').toLowerCase())
    }
    if (qty != null && cost != null) total += qty * cost
  }
  return { lines, toCreate, total: round2(total), problems, ok: lines > 0 && Object.keys(problems).length === 0 }
}

/** El cuerpo de POST /products para una línea nueva. El precio de venta se pone después: nace con «Precio variable». */
export function newProductBody(row, supplierId) {
  const cost = parseNumber(row.cost)
  return {
    name: row.newName.replace(/\s+/g, ' ').trim(),
    unit: row.unit,
    providerCode: row.code.trim() || undefined,
    supplierId,
    purchasePrice: cost != null && cost > 0 ? cost : 0,
    salePrice: 0,
    priceIsVariable: true,
  }
}

/**
 * El borrador que abre «Nueva recepción» ya llena. `productOf(row)` da el producto de cada línea (el del catálogo o
 * el recién creado). El mismo producto en dos líneas se junta: suma la cantidad y el costo queda como promedio.
 * Si el documento traía un total distinto de la suma de las líneas (impuestos, flete), se respeta el del documento
 * y la pantalla de la recepción enseña la diferencia.
 */
export function buildReceiptDraft({ supplier, rows, productOf, referenceDocument, documentTotal }) {
  const items = []
  const byId = new Map()
  for (const r of rows) {
    if (r.mode === 'skip') continue
    const product = productOf(r)
    if (!product) continue
    const quantity = parseNumber(r.qty) ?? 0
    const unitCost = r.cost.trim() === '' ? Number(product.purchasePrice ?? 0) : (parseNumber(r.cost) ?? 0)
    const seen = byId.get(product.id)
    if (seen) {
      const totalQty = seen.quantity + quantity
      seen.unitCost = totalQty > 0 ? (seen.unitCost * seen.quantity + unitCost * quantity) / totalQty : seen.unitCost
      seen.quantity = totalQty
    } else {
      const item = { product, quantity, unitCost }
      byId.set(product.id, item)
      items.push(item)
    }
  }
  const sum = round2(items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0))
  const docTotal = documentTotal != null && Number(documentTotal) > 0 ? round2(Number(documentTotal)) : null
  const differs = docTotal != null && Math.abs(docTotal - sum) >= 0.01
  return {
    supplier,
    items,
    paymentMode: 'CASH',
    totalAmount: differs ? docTotal : (sum > 0 ? sum : null),
    totalTouched: differs,
    referenceDocument: (referenceDocument ?? '').trim(),
    notes: '',
  }
}
