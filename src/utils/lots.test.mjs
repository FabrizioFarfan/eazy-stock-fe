import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lotBuckets, defaultLot, lineKey, availableFor, lotMissing, changeLineLot } from './lots.js'

const martillo = (over = {}) => ({
  id: 'm', currentStock: 30, looseStock: 20, attributes: { Sacapuntas: 'No' },
  lots: [{ id: 'l1', label: 'Sacapuntas: Sí', parameters: { Sacapuntas: 'Sí' }, quantity: 10 }], ...over,
})

test('los cubos: lo de sin lote, con su nombre si el producto lo dice, y cada lote', () => {
  assert.deepEqual(lotBuckets(martillo()), [
    { lotId: null, label: 'Sacapuntas: No', quantity: 20 },
    { lotId: 'l1', label: 'Sacapuntas: Sí', quantity: 10 },
  ])
  assert.equal(lotBuckets(martillo({ attributes: {} }))[0].label, null)
  assert.deepEqual(lotBuckets({ id: 'x', currentStock: 5 }), [])
})

test('sin lotes no se pregunta; con uno solo de donde sacar, tampoco; con dos, hay que elegir', () => {
  assert.equal(defaultLot({ id: 'x', currentStock: 5 }), null)
  assert.equal(defaultLot(martillo()), undefined)
  assert.equal(defaultLot(martillo({ currentStock: 10, looseStock: 0 })), 'l1')
  assert.equal(defaultLot(martillo({ lots: [{ id: 'l1', label: 'x', quantity: 0 }], looseStock: 30 })), null)
})

test('cuánto se puede vender en cada línea', () => {
  const product = martillo()
  assert.equal(availableFor({ product, lotId: 'l1' }), 10)
  assert.equal(availableFor({ product, lotId: null }), 20)
  assert.equal(availableFor({ product, lotId: undefined }), 30)
  assert.equal(availableFor({ product, lotId: 'otro' }), 0)
  assert.equal(availableFor({ product: { currentStock: 5 }, lotId: null }), 5)
})

test('falta el lote solo si de verdad hay que elegir', () => {
  assert.equal(lotMissing({ product: martillo() }), true)
  assert.equal(lotMissing({ product: martillo(), lotId: null }), false)
  assert.equal(lotMissing({ product: { id: 'viejo', currentStock: 3 } }), false)
})

test('cambiar de lote: si ya hay línea de ese lote, se juntan', () => {
  const product = martillo()
  const a = { product, lotId: undefined, quantity: 2 }
  const b = { product, lotId: 'l1', quantity: 3 }
  const moved = changeLineLot([a, b], lineKey(a), 'l1')
  assert.equal(moved.length, 1)
  assert.equal(moved[0].quantity, 5)
  const other = changeLineLot([a, b], lineKey(a), null)
  assert.deepEqual(other.map((i) => i.lotId), [null, 'l1'])
  assert.notEqual(lineKey(a), lineKey({ ...a, lotId: null }))
})
