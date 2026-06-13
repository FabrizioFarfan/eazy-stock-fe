// Helpers de cantidad — espejo de UnitUtil del backend.
//
// El stock y las cantidades viajan como DECIMAL(15,3) desde el BE para soportar
// venta por peso/medida (1.300 kg, 0.5 L). Acá centralizamos:
//  - qué unidades admiten decimales (todo menos "unidad")
//  - cómo formatear una cantidad sin ceros sobrantes (5.000 → "5", 1.300 → "1.3")
//  - la ayuda en gramos para productos en kilo

const KILO_UNITS = new Set(['kilo', 'kg', 'kilogramo', 'kilogramos'])

/**
 * Un producto es divisible (admite cantidades fraccionadas) salvo que su unidad
 * sea "unidad". kilo/litro/metro y unidades custom (galón, gramo, …) sí permiten
 * decimales. Espejo de UnitUtil.isDivisible del backend.
 */
export function isDivisibleUnit(unit) {
  if (unit == null) return false
  return unit.trim().toLowerCase() !== 'unidad'
}

/**
 * Formatea una cantidad para mostrar: hasta 3 decimales, sin ceros sobrantes.
 *   5      → "5"
 *   1.3    → "1.3"
 *   0.25   → "0.25"
 *   1.305  → "1.305"
 * Null/NaN → "—".
 */
export function formatQty(value) {
  if (value == null || value === '') return '—'
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n)) return '—'
  // toFixed(3) mata el ruido float (0.1+0.2), luego saca ceros y el punto colgante.
  return n.toFixed(3).replace(/\.?0+$/, '')
}

/** Cantidad + unidad, ej. "1.3 kg" / "5 unidades". Omite la unidad si no viene. */
export function formatQtyWithUnit(value, unit) {
  const q = formatQty(value)
  if (q === '—' || !unit) return q
  return `${q} ${unit}`
}

/** True si la unidad es de peso en kilos — habilita la ayuda visual en gramos. */
export function isKiloUnit(unit) {
  if (unit == null) return false
  return KILO_UNITS.has(unit.trim().toLowerCase())
}

/**
 * Equivalente en gramos de una cantidad en kg, ej. 1.3 → "1300 g".
 * Devuelve null si no aplica (cantidad vacía/0 o unidad no-kilo).
 */
export function gramsEquivalent(kg) {
  const n = typeof kg === 'number' ? kg : parseFloat(kg)
  if (!Number.isFinite(n) || n <= 0) return null
  const grams = Math.round(n * 1000)
  return `${grams.toLocaleString('es-PE')} g`
}
