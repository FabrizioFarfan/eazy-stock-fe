import { test } from 'node:test'
import assert from 'node:assert/strict'
import { purchasePriceChanges, totalExtra, decisionFields } from './purchasePriceChanges.js'

const line = (over) => ({ id: 'a', name: 'Clavos', quantity: 20, oldCost: 10, newCost: 13, salePrice: 15, ...over })

test('sube: diferencia, porcentaje, lo que cuesta de más y la ganancia antes y ahora', () => {
  const [c] = purchasePriceChanges([line()])
  assert.equal(c.diff, 3)
  assert.equal(c.pct, 30)
  assert.equal(c.extra, 60)
  assert.equal(c.oldMargin, 5)
  assert.equal(c.newMargin, 2)
})

test('baja: la diferencia y lo de más salen en negativo', () => {
  const [c] = purchasePriceChanges([line({ newCost: 8 })])
  assert.equal(c.diff, -2)
  assert.equal(c.pct, 20)
  assert.equal(c.extra, -40)
})

test('mismo precio, sin precio anterior o sin precio nuevo: no es un cambio', () => {
  assert.deepEqual(purchasePriceChanges([
    line({ newCost: 10 }), line({ oldCost: 0 }), line({ oldCost: null }), line({ newCost: null }), line({ newCost: '' }),
  ]), [])
})

test('sin precio de venta conocido no se calcula la ganancia', () => {
  const [c] = purchasePriceChanges([line({ salePrice: null })])
  assert.equal(c.salePrice, null)
  assert.equal(c.oldMargin, null)
  assert.equal(c.newMargin, null)
})

test('el total suma subidas y bajadas', () => {
  const changes = purchasePriceChanges([line(), line({ id: 'b', quantity: 10, newCost: 8 })])
  assert.equal(totalExtra(changes), 40)
})

test('al API solo va lo que el dueño eligió', () => {
  assert.deepEqual(decisionFields({}, 'a'), {})
  assert.deepEqual(decisionFields({ a: { keep: false } }, 'a'), {})
  assert.deepEqual(decisionFields({ a: { keep: true } }, 'a'), { keepProductCost: true })
  assert.deepEqual(decisionFields({ a: { keep: false, salePrice: 18 } }, 'a'), { salePrice: 18 })
})
