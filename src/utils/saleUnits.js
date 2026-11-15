// Formas de venta (William, 11-nov-2026: clavos sueltos, por ciento o por caja). Lógica pura, con tests.
// Un producto puede venderse, además de por su unidad, de a varias unidades con su propio precio: «ciento» = 100 a
// S/ 12. En el carrito la línea lleva `saleUnitId` (null = la unidad del producto) y su cantidad y su precio van EN
// ESA FORMA: 2 cientos a 12. El stock siempre se mide en la unidad del producto (2 cientos = 200).
// Espejo de isDivisibleUnit (utils/quantity.js), que no se puede importar en los tests por su dependencia de i18n.
const isDivisibleUnit = (unit) => unit != null && String(unit).trim().toLowerCase() !== 'unidad'

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Las formas de venta del producto (sin contar la unidad). */
export const saleUnitsOf = (product) => product?.saleUnits ?? []

/** La forma de la línea, o null si va por la unidad del producto (o si esa forma ya no existe). */
export function saleUnitOf(item) {
  if (!item?.saleUnitId) return null
  return saleUnitsOf(item.product).find((u) => u.id === item.saleUnitId) ?? null
}

/** Cuántas unidades del producto trae una de la línea (1 si va por unidad). */
export const factorOf = (item) => {
  const unit = saleUnitOf(item)
  return unit ? num(unit.units) : 1
}

/** Cuánto stock gasta la línea, en la unidad del producto. */
export const baseQuantity = (item) => Math.round(num(item.quantity) * factorOf(item) * 1000) / 1000

/** Precio de lista de la línea: el de su forma, o el del producto. */
export const listPriceOf = (item) => {
  const unit = saleUnitOf(item)
  return num(unit ? unit.salePrice : item.product?.salePrice)
}

/** Con una forma elegida el precio ya está dicho, aunque el producto sea de precio variable. */
export const isVariablePrice = (item) => !!item.product?.priceIsVariable && !saleUnitOf(item)

/** Precio con el que entra la línea al elegir una forma ('' = hay que escribirlo). */
export function startingPrice(product, saleUnitId) {
  const unit = saleUnitsOf(product).find((u) => u.id === saleUnitId)
  if (unit) return num(unit.salePrice)
  return product.priceIsVariable ? '' : num(product.salePrice)
}

/** Nombre de en qué se cuenta la línea: «ciento», o la unidad del producto. */
export const unitNameOf = (item, fallback = 'unidad') => saleUnitOf(item)?.name ?? item.product?.unit ?? fallback

/** Pasa la línea a otra forma (null = unidad): el precio vuelve al de lista de esa forma y la cantidad a 1. */
export function withSaleUnit(item, saleUnitId) {
  const id = saleUnitId || null
  if ((item.saleUnitId || null) === id) return item
  return { ...item, saleUnitId: id, quantity: 1, unitPrice: startingPrice(item.product, id) }
}

/**
 * Lo que el vendedor seguramente quiso: escribió 100 unidades y existe «ciento» → 1 ciento a 12. Solo para líneas por
 * unidad, cuando la cantidad es un múltiplo exacto de una forma. Gana la forma más grande. null = nada que sugerir.
 */
export function suggestSaleUnit(item) {
  if (saleUnitOf(item)) return null
  const quantity = num(item.quantity)
  if (quantity <= 0) return null
  const fits = saleUnitsOf(item.product)
    .filter((u) => num(u.units) > 1 && quantity >= num(u.units) && Math.abs(quantity / num(u.units) - Math.round(quantity / num(u.units))) < 1e-9)
    .sort((a, b) => num(b.units) - num(a.units))
  if (fits.length === 0) return null
  const unit = fits[0]
  const count = Math.round(quantity / num(unit.units))
  return { saleUnit: unit, count, total: Math.round(count * num(unit.salePrice) * 100) / 100 }
}

/** Acepta la sugerencia: la línea pasa a esa forma con su cuenta y su precio. */
export const applySuggestion = (item, suggestion) => ({
  ...item, saleUnitId: suggestion.saleUnit.id, quantity: suggestion.count, unitPrice: num(suggestion.saleUnit.salePrice),
})

/** La cantidad de la línea vale: positiva y, si el producto solo se vende entero, que dé unidades enteras. */
export function quantityIsValid(item) {
  const quantity = num(item.quantity)
  if (quantity <= 0) return false
  if (isDivisibleUnit(item.product?.unit)) return true
  const base = baseQuantity(item)
  return Math.abs(base - Math.round(base)) < 1e-9
}

/** Cuántas de la forma caben en lo que hay (stock en la unidad del producto). */
export function maxInSaleUnit(available, item) {
  const factor = factorOf(item)
  const max = num(available) / factor
  return isDivisibleUnit(item.product?.unit) && factor === 1 ? max : Math.floor(max * 1000 + 1e-6) / 1000
}

/**
 * Las líneas que juntas piden más de lo que hay: el mismo producto puede ir suelto y por ciento a la vez, y las dos
 * gastan del mismo stock. `availableFor(item)` da lo disponible del sitio (lote) de la línea; `groupKey(item)` las junta.
 */
export function overStockLines(cart, availableFor, groupKey) {
  const used = new Map()
  for (const item of cart) {
    if (item.product?.quickCreated) continue
    const key = groupKey(item)
    used.set(key, (used.get(key) ?? 0) + baseQuantity(item))
  }
  return cart.filter((item) => !item.product?.quickCreated && used.get(groupKey(item)) > num(availableFor(item)) + 1e-9)
}

/** El cuerpo de la línea para la API de ventas o cotizaciones: cantidad y precio en la forma elegida. */
export const saleUnitField = (item) => (saleUnitOf(item) ? { saleUnitId: item.saleUnitId } : {})

// ── Para enseñar una venta ya hecha ──────────────────────────────────────────

/** ¿La línea de una venta hecha se vendió en una forma que no es la unidad? */
export const soldInSaleUnit = (saleItem) => !!saleItem?.saleUnitName && num(saleItem.saleUnitQuantity) > 0

/**
 * Cómo se cobró la línea de una venta hecha, para tickets y detalles: cantidad, en qué, a cuánto y cuánto es en unidades.
 * Por unidad: { quantity: 5, unitName: 'unidad', price, listPrice, baseQuantity: null }.
 * Por forma:  { quantity: 2, unitName: 'ciento', price: 12, listPrice: 12, baseQuantity: 200, baseUnit: 'unidad' }.
 */
export function soldAs(saleItem, fallbackUnit = 'unidad') {
  if (!soldInSaleUnit(saleItem)) {
    return {
      quantity: num(saleItem.quantity),
      unitName: saleItem.productUnit || saleItem.unit || fallbackUnit,
      price: num(saleItem.unitPriceOverride ?? saleItem.unitPrice),
      listPrice: num(saleItem.unitPrice),
      baseQuantity: null,
      baseUnit: null,
    }
  }
  return {
    quantity: num(saleItem.saleUnitQuantity),
    unitName: saleItem.saleUnitName,
    price: num(saleItem.saleUnitPriceOverride ?? saleItem.saleUnitPrice),
    listPrice: num(saleItem.saleUnitPrice),
    baseQuantity: num(saleItem.quantity),
    baseUnit: saleItem.productUnit || fallbackUnit,
  }
}

// ── Para la ficha del producto ───────────────────────────────────────────────

/** Fila vacía del editor de formas. */
export const emptySaleUnitRow = () => ({ id: null, name: '', units: '', salePrice: '' })

/** Las filas del editor a partir de lo que trae el producto. */
export const rowsFromProduct = (product) =>
  saleUnitsOf(product).map((u) => ({ id: u.id, name: u.name, units: num(u.units), salePrice: num(u.salePrice) }))

const blank = (v) => v == null || String(v).trim() === ''

/** Una fila sin nada escrito no cuenta: se ignora al guardar. */
export const rowIsEmpty = (row) => blank(row.name) && blank(row.units) && blank(row.salePrice)

/**
 * Qué le falta a cada fila para poder guardarse. Devuelve una lista paralela a `rows`: null si está bien (o vacía), o
 * el código del primer problema: NAME, UNITS, PRICE, DUPLICATE, SAME_AS_UNIT.
 */
export function saleUnitRowErrors(rows, productUnit = 'unidad') {
  const seen = new Set()
  return rows.map((row) => {
    if (rowIsEmpty(row)) return null
    const name = String(row.name ?? '').trim().toLowerCase()
    if (!name) return 'NAME'
    if (name === String(productUnit ?? '').trim().toLowerCase()) return 'SAME_AS_UNIT'
    if (seen.has(name)) return 'DUPLICATE'
    seen.add(name)
    if (!(num(row.units) > 0)) return 'UNITS'
    if (blank(row.salePrice) || num(row.salePrice) < 0) return 'PRICE'
    return null
  })
}

/** Lo que viaja a la API: solo las filas con algo, ya limpias. */
export const saleUnitsPayload = (rows) => rows.filter((r) => !rowIsEmpty(r)).map((r) => ({
  ...(r.id ? { id: r.id } : {}),
  name: String(r.name).trim(),
  units: num(r.units),
  salePrice: num(r.salePrice),
}))

/** «sale a 0.12 la unidad»: cuánto cuesta cada unidad dentro de la forma, o null si no se puede calcular. */
export const pricePerBaseUnit = (row) => (num(row.units) > 0 && !blank(row.salePrice) ? num(row.salePrice) / num(row.units) : null)

// ── Para la cotización ───────────────────────────────────────────────────────
// Una línea de cotización guarda `unit` (en qué se cotiza: «ciento»), y su cantidad y precio van en esa forma.

/** Los campos de forma de una línea de cotización. La forma se respeta solo si el producto la sigue teniendo. */
export function quoteFormFields(baseUnit, saleUnits, basePrice, saleUnitId) {
  const list = saleUnits ?? []
  return { baseUnit: baseUnit ?? 'unidad', saleUnits: list, basePrice: num(basePrice), saleUnitId: list.some((u) => u.id === saleUnitId) ? saleUnitId : null }
}

/** Lo que cambia en la línea al elegir otra forma (null = la unidad): en qué se cotiza y su precio de lista. */
export function quoteFormPatch(line, saleUnitId) {
  const unit = (line.saleUnits ?? []).find((u) => u.id === saleUnitId)
  return unit
    ? { saleUnitId: unit.id, unit: unit.name, unitPrice: num(unit.salePrice) }
    : { saleUnitId: null, unit: line.baseUnit, unitPrice: num(line.basePrice) }
}

/**
 * La línea de una cotización guardada, lista para el carrito de Nueva venta. Si la forma cotizada ya no existe en el
 * producto, se pasa a unidades (3 cientos → 300 a 0.12) para que el total cotizado se mantenga. La cantidad se
 * recorta a lo que hay hoy (mínimo 1), como siempre.
 */
export function cartLineFromQuoteItem(it) {
  const stock = num(it.currentStock)
  const forms = it.saleUnits ?? []
  const form = it.saleUnitId ? forms.find((u) => u.id === it.saleUnitId) : null
  const lostFactor = it.saleUnitId && !form ? num(it.saleUnitFactor) || 1 : 1
  const product = {
    id: it.productId, name: it.productName, sku: it.productSku, unit: it.productUnit ?? (it.saleUnitId ? 'unidad' : it.unit),
    currentStock: stock, priceIsVariable: it.priceIsVariable, salePrice: it.currentSalePrice, saleUnits: forms,
  }
  const wanted = num(it.quantity) * lostFactor
  const fits = form ? Math.floor(stock / num(form.units)) : stock
  const quantity = Math.min(wanted, fits)
  return {
    product,
    quantity: quantity > 0 ? quantity : 1,
    saleUnitId: form ? form.id : null,
    unitPrice: num(it.unitPrice) / lostFactor,
  }
}

/** ¿Hay hoy stock para lo cotizado en la línea? (la cantidad va en su forma) */
export const quoteItemShort = (it) => num(it.currentStock) < num(it.quantity) * (it.saleUnitId ? num(it.saleUnitFactor) || 1 : 1)
