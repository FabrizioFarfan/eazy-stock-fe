// «Carga tu inventario con fotos» (21-nov-2026): la lógica de la revisión, sin React, para poder probarla.

export const PHOTO_UNITS = ['unidad', 'metro', 'kilo', 'litro']
/** El servidor no acepta fotos de más de 900 KB (y nginx corta la petición a 1 MB). */
export const MAX_PHOTO_BYTES = 850 * 1024

/** «12,50» → 12.5 · '' → null · «abc» → null. Nunca negativo. */
export function parseNumber(raw) {
  if (raw == null) return null
  const text = String(raw).trim().replace(',', '.')
  if (text === '' || !/^\d*\.?\d+$|^\d+\.$/.test(text)) return null
  const n = Number(text)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * Lo que propone la IA → filas editables. Lo que ya existe en el catálogo llega SIN marcar («saltar»):
 * marcarlo es «actualizar su precio». Lo nuevo llega marcado.
 */
export function toRows(items = []) {
  return items.map((it) => ({
    key: it.ref,
    name: it.name ?? '',
    category: it.category ?? '',
    unit: PHOTO_UNITS.includes(it.unit) ? it.unit : 'unidad',
    brand: it.brand ?? '',
    barcode: it.barcode ?? '',
    price: it.salePrice != null ? String(it.salePrice) : '',
    stock: it.quantity != null ? String(it.quantity) : '',
    confidence: it.confidence ?? 'MEDIUM',
    photo: it.photo ?? 1,
    existing: it.existing ?? null,
    checked: !it.existing,
  }))
}

/**
 * Qué se va a hacer con lo marcado y qué le falta: sin nombre no se crea, y para actualizar uno que ya
 * existe hace falta un precio. `problems` = { [key]: 'NAME' | 'PRICE' | 'NUMBER' | 'DUPLICATE' }.
 */
export function reviewSummary(rows) {
  const problems = {}
  let create = 0
  let update = 0
  const seen = new Set()
  for (const r of rows) {
    if (!r.checked) continue
    const price = parseNumber(r.price)
    const badNumber = (r.price.trim() !== '' && price == null) || (r.stock.trim() !== '' && parseNumber(r.stock) == null)
    if (r.existing) {
      if (badNumber) problems[r.key] = 'NUMBER'
      else if (price == null || price <= 0) problems[r.key] = 'PRICE'
      update += 1
      continue
    }
    const compact = r.name.replace(/\s+/g, '').toLowerCase()
    if (compact === '') problems[r.key] = 'NAME'
    else if (seen.has(compact)) problems[r.key] = 'DUPLICATE'
    else if (badNumber) problems[r.key] = 'NUMBER'
    seen.add(compact)
    create += 1
  }
  return { create, update, problems, ok: Object.keys(problems).length === 0 && create + update > 0 }
}

/** El cuerpo de POST /photo-loads/{id}/confirm con lo marcado. Sin precio → el servidor lo deja «Precio variable». */
export function buildConfirmBody(rows, supplierId) {
  const items = rows.filter((r) => r.checked).map((r) => {
    const price = parseNumber(r.price)
    if (r.existing) {
      return { name: r.existing.name, salePrice: price, action: 'UPDATE', existingId: r.existing.id }
    }
    const stock = parseNumber(r.stock)
    return {
      name: r.name.replace(/\s+/g, ' ').trim(),
      category: r.category.trim() || null,
      unit: r.unit,
      brand: r.brand.trim() || null,
      barcode: r.barcode.trim() || null,
      salePrice: price != null && price > 0 ? price : null,
      stock: stock != null && stock > 0 ? stock : null,
      action: 'CREATE',
    }
  })
  return { supplierId, items }
}

/** Tras confirmar: sólo quedan a la vista las filas que el servidor no pudo crear, con su motivo. */
export function keepFailed(rows, failed = []) {
  const reasons = new Map(failed.map((f) => [f.name.replace(/\s+/g, '').toLowerCase(), f.reason]))
  return rows
    .filter((r) => r.checked && reasons.has((r.existing ? r.existing.name : r.name).replace(/\s+/g, '').toLowerCase()))
    .map((r) => ({ ...r, failure: reasons.get((r.existing ? r.existing.name : r.name).replace(/\s+/g, '').toLowerCase()) }))
}
