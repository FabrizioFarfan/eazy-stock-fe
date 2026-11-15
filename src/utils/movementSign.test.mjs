import test from 'node:test'
import assert from 'node:assert/strict'
import { signedQuantity, signedQuantityLabel, movementDirection } from './movementSign.js'

test('un ajuste hacia abajo lleva su signo menos (el caso de William: 12 → 11 salía como «1»)', () => {
  assert.equal(signedQuantity('ADJUSTMENT', -1), -1)
  assert.equal(signedQuantityLabel('ADJUSTMENT', -1), '−1')
  assert.equal(signedQuantityLabel('ADJUSTMENT', '-16.000'), '−16')
  assert.equal(movementDirection('ADJUSTMENT', -1), 'down')
})

test('un ajuste hacia arriba lleva su más', () => {
  assert.equal(signedQuantityLabel('ADJUSTMENT', 12), '+12')
  assert.equal(signedQuantityLabel('ADJUSTMENT', 1.7), '+1.7')
  assert.equal(movementDirection('ADJUSTMENT', 2), 'up')
})

test('ventas y devoluciones al proveedor bajan aunque la API las guarde en positivo', () => {
  assert.equal(signedQuantityLabel('SALE', 2), '−2')
  assert.equal(signedQuantityLabel('SALE', '0.250'), '−0.25')
  assert.equal(signedQuantityLabel('SUPPLIER_RETURN', 3), '−3')
  assert.equal(movementDirection('SALE', 2), 'down')
})

test('entradas y devoluciones de cliente suben', () => {
  assert.equal(signedQuantityLabel('PURCHASE_ENTRY', 6), '+6')
  assert.equal(signedQuantityLabel('RETURN', 1), '+1')
  assert.equal(movementDirection('RETURN', 1), 'up')
})

test('cero o basura no rompen', () => {
  assert.equal(signedQuantityLabel('ADJUSTMENT', 0), '0')
  assert.equal(signedQuantityLabel('SALE', undefined), '0')
  assert.equal(movementDirection('ADJUSTMENT', 0), 'same')
})
