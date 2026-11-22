import test from 'node:test'
import assert from 'node:assert/strict'
import { offersByProduct, cheaperOffer, cheaperRows, addExtra, peekExtras, setExtras, mergeExtras } from './supplierCompare.js'

const henry = { supplierId: 'h', supplierName: 'Henry', unitCost: 11.5, date: '2026-11-01T10:00:00' }
const francesco = { supplierId: 'f', supplierName: 'Francesco', unitCost: 10.2, date: '2026-11-15T10:00:00' }
const tercero = { supplierId: 't', supplierName: 'Tercero', unitCost: 10.9, date: '2026-10-01T10:00:00' }
const offers = [francesco, tercero, henry] // como llega del API: del más barato al más caro

function memory() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }
}

test('si le pido a Henry, avisa que Francesco lo dio más barato y cuánto', () => {
  const hit = cheaperOffer(offers, 'h')
  assert.equal(hit.best.supplierName, 'Francesco')
  assert.equal(hit.mine.unitCost, 11.5)
  assert.ok(Math.abs(hit.saving - 1.3) < 1e-9)
  assert.equal(hit.pct, 11)
})

test('al más barato no se le avisa nada, ni al que nunca me lo vendió, ni si empatan', () => {
  assert.equal(cheaperOffer(offers, 'f'), null)
  assert.equal(cheaperOffer(offers, 'nadie'), null)
  assert.equal(cheaperOffer([henry, { ...francesco, unitCost: 11.5 }], 'h'), null)
  assert.equal(cheaperOffer(undefined, 'h'), null)
})

test('en el pedido solo salen las filas con otro más barato, con el ahorro por la cantidad', () => {
  const by = offersByProduct([{ productId: 'p1', offers }, { productId: 'p2', offers: [henry] }])
  const rows = [{ productId: 'p1', qty: 10 }, { productId: 'p2', qty: 3 }, { productId: 'p3', qty: 1 }]
  const hits = cheaperRows(rows, by, 'h')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].row.productId, 'p1')
  assert.ok(Math.abs(hits[0].total - 13) < 1e-9)
})

test('lo que se pasa a otro proveedor espera en su pedido y entra una sola vez', () => {
  const s = memory()
  assert.equal(addExtra(s, 'b', 'f', { productId: 'p1', qty: 10 }), 1)
  assert.equal(addExtra(s, 'b', 'f', { productId: 'p1', qty: 12 }), 1) // el mismo producto: se queda la última
  assert.equal(addExtra(s, 'b', 'f', { productId: 'p2', qty: 1 }), 2)
  assert.equal(peekExtras(s, 'b', 'f').length, 2)
  assert.deepEqual(peekExtras(s, 'b', 'h'), [])
  const taken = peekExtras(s, 'b', 'f')
  assert.deepEqual(taken.map((r) => [r.productId, r.qty]), [['p1', 12], ['p2', 1]])
  // Siguen esperando hasta que el pedido se envía; al cambiar una cantidad se reescriben, y sin filas no espera nada.
  setExtras(s, 'b', 'f', [{ productId: 'p1', qty: 20 }])
  assert.deepEqual(peekExtras(s, 'b', 'f'), [{ productId: 'p1', qty: 20 }])
  setExtras(s, 'b', 'f', [])
  assert.deepEqual(peekExtras(s, 'b', 'f'), [])
  assert.deepEqual(mergeExtras([{ productId: 'p2', qty: 5 }], taken).map((r) => [r.productId, r.qty]), [['p2', 5], ['p1', 12]])
})

test('al comprar: avisa si otro proveedor lo dio más barato la última vez', async () => {
  const { cheaperThanCost } = await import('./supplierCompare.js')
  const offers = [
    { supplierId: 'femaco', supplierName: 'Femaco', unitCost: 8, date: '2026-11-10' },
    { supplierId: 'ferdicon', supplierName: 'Ferdicon', unitCost: 9.5, date: '2026-11-01' },
  ]
  // compro a Ferdicon a 10: Femaco lo dio a 8
  const hit = cheaperThanCost(offers, 'ferdicon', 10)
  assert.equal(hit.best.supplierName, 'Femaco')
  assert.equal(hit.extra, 2)
  assert.equal(hit.pct, 20)
  // compro a Femaco (el más barato): se compara con el siguiente, Ferdicon a 9.5
  assert.equal(cheaperThanCost(offers, 'femaco', 9), null)
  assert.equal(cheaperThanCost(offers, 'femaco', 10).best.supplierName, 'Ferdicon')
  // igual o más barato que todos, sin costo todavía, o sin compras a otros: nada
  assert.equal(cheaperThanCost(offers, 'ferdicon', 8), null)
  assert.equal(cheaperThanCost(offers, 'ferdicon', 8.005), null)
  assert.equal(cheaperThanCost(offers, 'ferdicon', null), null)
  assert.equal(cheaperThanCost([offers[1]], 'ferdicon', 50), null)
  assert.equal(cheaperThanCost(undefined, 'x', 5), null)
})
