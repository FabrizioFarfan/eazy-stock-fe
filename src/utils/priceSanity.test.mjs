import test from 'node:test'
import assert from 'node:assert/strict'
import { priceWarnings } from './priceSanity.js'

test('S/ 8 que queda a S/ 0.80 avisa por cambio grande y por quedar bajo el costo', () => {
  const w = priceWarnings({ newPrice: 0.8, oldPrice: 8, cost: 5 })
  assert.deepEqual(w.map((x) => x.code), ['BELOW_COST', 'BIG_CHANGE'])
  assert.equal(w[1].pct, 90)
  assert.equal(w[1].down, true)
})

test('un cambio del 50 % no molesta; uno del 81 % sí (también hacia arriba)', () => {
  assert.deepEqual(priceWarnings({ newPrice: 12, oldPrice: 8 }), [])
  assert.equal(priceWarnings({ newPrice: 14.5, oldPrice: 8 })[0]?.code, 'BIG_CHANGE')
})

test('en el alta solo cuenta el costo; sin costo (vendedor) o precio variable no hay aviso', () => {
  assert.equal(priceWarnings({ newPrice: 4, cost: 5 })[0]?.code, 'BELOW_COST')
  assert.deepEqual(priceWarnings({ newPrice: 4, cost: null, oldPrice: null }), [])
  assert.deepEqual(priceWarnings({ newPrice: 0.5, oldPrice: 8, cost: 5, variable: true }), [])
  assert.deepEqual(priceWarnings({ newPrice: '', oldPrice: 8 }), [])
  assert.deepEqual(priceWarnings({ newPrice: '7,5', oldPrice: 8, cost: 5 }), [])
})
