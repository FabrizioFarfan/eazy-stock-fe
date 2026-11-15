import test from 'node:test'
import assert from 'node:assert/strict'
import {
  saleUnitOf, factorOf, baseQuantity, listPriceOf, isVariablePrice, startingPrice, withSaleUnit, suggestSaleUnit, applySuggestion,
  quantityIsValid, maxInSaleUnit, overStockLines, saleUnitField, soldAs, soldInSaleUnit, saleUnitRowErrors, saleUnitsPayload,
  rowsFromProduct, pricePerBaseUnit, unitNameOf,
} from './saleUnits.js'

const ciento = { id: 'c', name: 'ciento', units: 100, salePrice: 12 }
const caja = { id: 'k', name: 'caja', units: 1000, salePrice: 100 }
const clavo = { id: 'p1', name: 'Clavo', unit: 'unidad', salePrice: 0.2, currentStock: 5000, saleUnits: [ciento, caja] }
const cable = { id: 'p2', name: 'Cable', unit: 'metro', salePrice: 3, currentStock: 250, saleUnits: [{ id: 'r', name: 'rollo', units: 100, salePrice: 250 }] }
const line = (product, quantity, saleUnitId = null, unitPrice) => ({ product, quantity, saleUnitId, unitPrice: unitPrice ?? startingPrice(product, saleUnitId) })

test('una línea por unidad se comporta como siempre', () => {
  const l = line(clavo, 30)
  assert.equal(saleUnitOf(l), null)
  assert.equal(factorOf(l), 1)
  assert.equal(baseQuantity(l), 30)
  assert.equal(listPriceOf(l), 0.2)
  assert.equal(unitNameOf(l), 'unidad')
  assert.deepEqual(saleUnitField(l), {})
})

test('dos cientos gastan doscientos clavos y se cobran por ciento', () => {
  const l = line(clavo, 2, 'c')
  assert.equal(factorOf(l), 100)
  assert.equal(baseQuantity(l), 200)
  assert.equal(listPriceOf(l), 12)
  assert.equal(l.unitPrice, 12)
  assert.equal(unitNameOf(l), 'ciento')
  assert.deepEqual(saleUnitField(l), { saleUnitId: 'c' })
})

test('una forma que ya no existe en el producto cuenta como unidad', () => {
  const l = line(clavo, 2, 'borrada', 12)
  assert.equal(saleUnitOf(l), null)
  assert.equal(baseQuantity(l), 2)
  assert.deepEqual(saleUnitField(l), {})
})

test('cambiar de forma pone su precio de lista y vuelve la cantidad a 1', () => {
  const l = withSaleUnit(line(clavo, 30, null, 0.15), 'k')
  assert.deepEqual([l.saleUnitId, l.quantity, l.unitPrice], ['k', 1, 100])
  const back = withSaleUnit(l, null)
  assert.deepEqual([back.saleUnitId, back.quantity, back.unitPrice], [null, 1, 0.2])
  assert.equal(withSaleUnit(l, 'k'), l)
})

test('precio variable: por unidad hay que escribirlo, con una forma ya viene', () => {
  const variable = { ...clavo, priceIsVariable: true, salePrice: 0 }
  assert.equal(startingPrice(variable, null), '')
  assert.equal(startingPrice(variable, 'c'), 12)
  assert.equal(isVariablePrice(line(variable, 1)), true)
  assert.equal(isVariablePrice(line(variable, 1, 'c')), false)
})

test('100 unidades sugieren 1 ciento; 1000, la caja; 150, nada', () => {
  const s = suggestSaleUnit(line(clavo, 100))
  assert.deepEqual([s.saleUnit.id, s.count, s.total], ['c', 1, 12])
  const big = suggestSaleUnit(line(clavo, 1000))
  assert.deepEqual([big.saleUnit.id, big.count, big.total], ['k', 1, 100])
  assert.equal(suggestSaleUnit(line(clavo, 300)).count, 3)
  assert.equal(suggestSaleUnit(line(clavo, 150)), null)
  assert.equal(suggestSaleUnit(line(clavo, 99)), null)
  assert.equal(suggestSaleUnit(line(clavo, 1, 'c')), null)
  assert.equal(suggestSaleUnit(line({ ...clavo, saleUnits: [] }, 100)), null)
})

test('aceptar la sugerencia deja la línea en esa forma', () => {
  const l = line(clavo, 300)
  const done = applySuggestion(l, suggestSaleUnit(l))
  assert.deepEqual([done.saleUnitId, done.quantity, done.unitPrice], ['c', 3, 12])
  assert.equal(baseQuantity(done), 300)
})

test('la cantidad vale si da unidades enteras en productos que no se parten', () => {
  assert.equal(quantityIsValid(line(clavo, 2, 'c')), true)
  assert.equal(quantityIsValid(line(clavo, 0.5, 'c')), true)
  assert.equal(quantityIsValid(line(clavo, 0.005, 'c')), false)
  assert.equal(quantityIsValid(line(clavo, 1.5)), false)
  assert.equal(quantityIsValid(line(clavo, 0, 'c')), false)
  assert.equal(quantityIsValid(line(cable, 1.5)), true)
  assert.equal(quantityIsValid(line(cable, 0.25, 'r')), true)
})

test('cuántas formas caben en el stock', () => {
  assert.equal(maxInSaleUnit(5000, line(clavo, 1, 'c')), 50)
  assert.equal(maxInSaleUnit(250, line(clavo, 1, 'c')), 2.5)
  assert.equal(maxInSaleUnit(250, line(cable, 1, 'r')), 2.5)
  assert.equal(maxInSaleUnit(250, line(cable, 1)), 250)
})

test('suelto y por ciento gastan del mismo stock', () => {
  const key = (i) => i.product.id
  const available = (i) => i.product.currentStock
  const small = { ...clavo, currentStock: 250 }
  assert.equal(overStockLines([line(small, 2, 'c'), line(small, 50)], available, key).length, 0)
  assert.equal(overStockLines([line(small, 2, 'c'), line(small, 51)], available, key).length, 2)
  assert.equal(overStockLines([line(small, 3, 'c')], available, key).length, 1)
  assert.equal(overStockLines([line({ ...small, quickCreated: true }, 3, 'c')], available, key).length, 0)
})

test('una venta hecha por ciento se enseña como se cobró', () => {
  const sold = { quantity: 200, unitPrice: 0.12, unitPriceOverride: null, subtotal: 24, productUnit: 'unidad',
    saleUnitName: 'ciento', saleUnitFactor: 100, saleUnitQuantity: 2, saleUnitPrice: 12, saleUnitPriceOverride: null }
  assert.equal(soldInSaleUnit(sold), true)
  assert.deepEqual(soldAs(sold), { quantity: 2, unitName: 'ciento', price: 12, listPrice: 12, baseQuantity: 200, baseUnit: 'unidad' })
  assert.equal(soldAs({ ...sold, saleUnitPriceOverride: 11 }).price, 11)
  const plain = { quantity: 5, unitPrice: 0.2, unitPriceOverride: 0.15, productUnit: 'unidad' }
  assert.equal(soldInSaleUnit(plain), false)
  assert.deepEqual(soldAs(plain), { quantity: 5, unitName: 'unidad', price: 0.15, listPrice: 0.2, baseQuantity: null, baseUnit: null })
  // Ventas de antes (sin productUnit) y APIs viejas (sin los campos).
  assert.equal(soldAs({ quantity: 1, unitPrice: 3 }).unitName, 'unidad')
})

test('el editor de la ficha dice qué le falta a cada fila e ignora las vacías', () => {
  const rows = [
    { id: 'c', name: 'ciento', units: 100, salePrice: 12 },
    { id: null, name: '', units: '', salePrice: '' },
    { id: null, name: 'Ciento', units: 100, salePrice: 11 },
    { id: null, name: 'caja', units: '', salePrice: 100 },
    { id: null, name: 'docena', units: 12, salePrice: '' },
    { id: null, name: '', units: 6, salePrice: 1 },
    { id: null, name: 'Unidad', units: 6, salePrice: 1 },
  ]
  assert.deepEqual(saleUnitRowErrors(rows, 'unidad'), [null, null, 'DUPLICATE', 'UNITS', 'PRICE', 'NAME', 'SAME_AS_UNIT'])
  assert.deepEqual(saleUnitsPayload(rows.slice(0, 2)), [{ id: 'c', name: 'ciento', units: 100, salePrice: 12 }])
  assert.deepEqual(saleUnitsPayload([{ id: null, name: ' docena ', units: '12', salePrice: '2.5' }]), [{ name: 'docena', units: 12, salePrice: 2.5 }])
  assert.deepEqual(rowsFromProduct(clavo)[0], { id: 'c', name: 'ciento', units: 100, salePrice: 12 })
  assert.deepEqual(rowsFromProduct({}), [])
  assert.equal(pricePerBaseUnit({ units: 100, salePrice: 12 }), 0.12)
  assert.equal(pricePerBaseUnit({ units: '', salePrice: 12 }), null)
})

import { quoteFormFields, quoteFormPatch, cartLineFromQuoteItem, quoteItemShort } from './saleUnits.js'

test('cotización: elegir el ciento cambia en qué se cotiza y su precio, y volver a la unidad lo deshace', () => {
  const l = { unit: 'unidad', unitPrice: 0.2, ...quoteFormFields('unidad', [ciento, caja], 0.2, null) }
  assert.deepEqual(quoteFormPatch(l, 'c'), { saleUnitId: 'c', unit: 'ciento', unitPrice: 12 })
  assert.deepEqual(quoteFormPatch({ ...l, saleUnitId: 'c' }, null), { saleUnitId: null, unit: 'unidad', unitPrice: 0.2 })
  assert.equal(quoteFormFields('unidad', [ciento], 0.2, 'borrada').saleUnitId, null)
  assert.deepEqual(quoteFormFields(undefined, undefined, undefined, null), { baseUnit: 'unidad', saleUnits: [], basePrice: 0, saleUnitId: null })
})

test('cotización → venta: 3 cientos entran como 3 cientos, recortados a lo que hay', () => {
  const it = { productId: 'p1', productName: 'Clavo', productSku: 'C1', unit: 'ciento', productUnit: 'unidad', quantity: 3, unitPrice: 11,
    currentStock: 5000, currentSalePrice: 0.2, priceIsVariable: false, saleUnitId: 'c', saleUnitFactor: 100, saleUnits: [ciento, caja] }
  const line = cartLineFromQuoteItem(it)
  assert.deepEqual([line.saleUnitId, line.quantity, line.unitPrice, line.product.unit], ['c', 3, 11, 'unidad'])
  assert.equal(baseQuantity(line), 300)
  assert.equal(quoteItemShort(it), false)
  const few = { ...it, currentStock: 250 }
  assert.equal(cartLineFromQuoteItem(few).quantity, 2)
  assert.equal(quoteItemShort(few), true)
})

test('cotización → venta: si la forma ya no existe, pasa a unidades con el mismo total', () => {
  const it = { productId: 'p1', productName: 'Clavo', unit: 'ciento', productUnit: 'unidad', quantity: 3, unitPrice: 12,
    currentStock: 5000, currentSalePrice: 0.2, saleUnitId: 'c', saleUnitFactor: 100, saleUnits: [caja] }
  const line = cartLineFromQuoteItem(it)
  assert.deepEqual([line.saleUnitId, line.quantity, line.product.unit], [null, 300, 'unidad'])
  assert.ok(Math.abs(line.quantity * line.unitPrice - 36) < 1e-9)
})

test('cotización → venta: una línea por unidad queda como siempre', () => {
  const line = cartLineFromQuoteItem({ productId: 'p2', productName: 'Cable', unit: 'metro', quantity: 30, unitPrice: 3, currentStock: 12, currentSalePrice: 3 })
  assert.deepEqual([line.saleUnitId, line.quantity, line.unitPrice, line.product.unit], [null, 12, 3, 'metro'])
})
