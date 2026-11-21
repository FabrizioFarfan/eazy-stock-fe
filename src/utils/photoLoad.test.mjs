import test from 'node:test'
import assert from 'node:assert/strict'
import { buildConfirmBody, keepFailed, parseNumber, reviewSummary, toRows } from './photoLoad.js'

const ITEMS = [
  { ref: 1, name: 'Pintura látex 1 gal', category: 'Pinturas', unit: 'unidad', brand: 'Vencedor', barcode: null, salePrice: 45.9, quantity: 6, confidence: 'HIGH', photo: 1, existing: null },
  { ref: 2, name: 'Clavo 2 pulgadas', category: 'Tornillería', unit: 'kilo', brand: null, barcode: null, salePrice: null, quantity: null, confidence: 'LOW', photo: 2, existing: null },
  { ref: 3, name: 'martillo de uña', category: null, unit: 'pieza', brand: null, barcode: null, salePrice: 25, quantity: 3, confidence: 'MEDIUM', photo: 2, existing: { id: 'p-9', name: 'Martillo de Uña', salePrice: 20, priceIsVariable: false, currentStock: 4 } },
]

test('los números aceptan coma y rechazan lo que no es número', () => {
  assert.equal(parseNumber('12,50'), 12.5)
  assert.equal(parseNumber(' 3 '), 3)
  assert.equal(parseNumber(''), null)
  assert.equal(parseNumber('doce'), null)
  assert.equal(parseNumber('-4'), null)
})

test('lo nuevo llega marcado y lo que ya existe llega sin marcar (saltar)', () => {
  const rows = toRows(ITEMS)
  assert.deepEqual(rows.map((r) => r.checked), [true, true, false])
  assert.equal(rows[2].unit, 'unidad') // una unidad que no conocemos cae en «unidad»
  assert.equal(rows[1].price, '')
  assert.deepEqual(reviewSummary(rows), { create: 2, update: 0, problems: {}, ok: true })
})

test('sin precio queda con precio variable y sin contar queda con stock 0', () => {
  const body = buildConfirmBody(toRows(ITEMS), 'sup-1')
  assert.equal(body.supplierId, 'sup-1')
  assert.equal(body.items.length, 2)
  assert.deepEqual(body.items[0], { name: 'Pintura látex 1 gal', category: 'Pinturas', unit: 'unidad', brand: 'Vencedor', barcode: null, salePrice: 45.9, stock: 6, action: 'CREATE' })
  assert.equal(body.items[1].salePrice, null)
  assert.equal(body.items[1].stock, null)
})

test('marcar uno que ya existe es actualizar su precio, y pide un precio', () => {
  const rows = toRows(ITEMS)
  rows[2].checked = true
  assert.equal(reviewSummary(rows).update, 1)
  assert.deepEqual(buildConfirmBody(rows, 's').items[2], { name: 'Martillo de Uña', salePrice: 25, action: 'UPDATE', existingId: 'p-9' })
  rows[2].price = ''
  const s = reviewSummary(rows)
  assert.equal(s.ok, false)
  assert.equal(s.problems[3], 'PRICE')
})

test('avisa de nombres vacíos, repetidos y números mal escritos', () => {
  const rows = toRows(ITEMS)
  rows[0].name = '  '
  rows[1].price = 'doce'
  assert.deepEqual(reviewSummary(rows).problems, { 1: 'NAME', 2: 'NUMBER' })
  rows[0].name = 'CLAVO 2  pulgadas'
  rows[1].price = ''
  assert.deepEqual(reviewSummary(rows).problems, { 2: 'DUPLICATE' })
  // nada marcado no es «listo»
  assert.equal(reviewSummary(rows.map((r) => ({ ...r, checked: false }))).ok, false)
})

test('tras confirmar sólo quedan las filas que fallaron, con su motivo', () => {
  const left = keepFailed(toRows(ITEMS), [{ name: 'Clavo 2 pulgadas', reason: 'Ya existe un producto con ese nombre' }])
  assert.equal(left.length, 1)
  assert.equal(left[0].key, 2)
  assert.equal(left[0].failure, 'Ya existe un producto con ese nombre')
})
