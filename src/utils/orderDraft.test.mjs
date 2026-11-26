import test from 'node:test'
import assert from 'node:assert/strict'
import { orderOrigin, orderDraftKey, loadOrderDraft, saveOrderDraft, clearOrderDraft } from './orderDraft.js'

function memory() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), size: () => m.size }
}

const low = orderOrigin('low')
const week = orderOrigin('sales', '2026-11-16', '2026-11-22')
const bajo = [{ productId: 'a', productName: 'Bajo el mínimo', qty: 5 }]
const vendido = [{ productId: 'b', productName: 'Vendido en la semana', qty: 2 }]

test('William: el pedido que dejó abierto en Stock bajo no sale al armar el de lo vendido en unas fechas', () => {
  const s = memory()
  saveOrderDraft(s, 'biz', 'femaco', low, { rows: bajo, removed: [], notes: '' })
  assert.equal(loadOrderDraft(s, 'biz', 'femaco', week), null)
  // y al revés: lo vendido tampoco pisa ni aparece en el pedido de Stock bajo
  saveOrderDraft(s, 'biz', 'femaco', week, { rows: vendido, removed: [], notes: '' })
  assert.deepEqual(loadOrderDraft(s, 'biz', 'femaco', low).rows, bajo)
  assert.deepEqual(loadOrderDraft(s, 'biz', 'femaco', week).rows, vendido)
})

test('un borrador de antes del cambio (sin origen) solo vale para Stock bajo', () => {
  const s = memory()
  s.setItem('eazystock_order_draft_biz_femaco', JSON.stringify({ rows: bajo, removed: [], notes: 'x', savedAt: 1 }))
  assert.equal(loadOrderDraft(s, 'biz', 'femaco', week), null)
  assert.equal(loadOrderDraft(s, 'biz', 'femaco', orderOrigin('restock', '2026-11-01', '2026-11-22')), null)
  assert.equal(loadOrderDraft(s, 'biz', 'femaco', low).notes, 'x')
  assert.equal(orderDraftKey('biz', 'femaco', low), 'eazystock_order_draft_biz_femaco')
})

test('con otras fechas el borrador de lo vendido ya no vale, y el nuevo lo pisa (no se acumulan)', () => {
  const s = memory()
  saveOrderDraft(s, 'biz', 'femaco', week, { rows: vendido, removed: [], notes: '' })
  const next = orderOrigin('sales', '2026-11-23', '2026-11-29')
  assert.equal(loadOrderDraft(s, 'biz', 'femaco', next), null)
  saveOrderDraft(s, 'biz', 'femaco', next, { rows: bajo, removed: [], notes: '' })
  assert.equal(s.size(), 1)
  assert.equal(loadOrderDraft(s, 'biz', 'femaco', week), null)
})

test('mismas fechas: el borrador vuelve con lo quitado y las notas; Resurtido y Ventas no se mezclan', () => {
  const s = memory()
  saveOrderDraft(s, 'biz', 'femaco', week, { rows: vendido, removed: bajo, notes: 'jueves' })
  const d = loadOrderDraft(s, 'biz', 'femaco', orderOrigin('sales', '2026-11-16', '2026-11-22'))
  assert.deepEqual(d.removed, bajo)
  assert.equal(d.notes, 'jueves')
  assert.equal(loadOrderDraft(s, 'biz', 'femaco', orderOrigin('restock', '2026-11-16', '2026-11-22')), null)
  assert.equal(loadOrderDraft(s, 'biz', 'otro', week), null)
  clearOrderDraft(s, 'biz', 'femaco', week)
  assert.equal(loadOrderDraft(s, 'biz', 'femaco', week), null)
})

test('sin fechas («todo el historial») también es un período, y basura guardada no rompe', () => {
  const s = memory()
  const all = orderOrigin('sales')
  saveOrderDraft(s, 'biz', 'femaco', all, { rows: vendido, removed: [], notes: '' })
  assert.deepEqual(loadOrderDraft(s, 'biz', 'femaco', orderOrigin('sales', '', '')).rows, vendido)
  s.setItem(orderDraftKey('biz', 'x', low), '{no es json')
  assert.equal(loadOrderDraft(s, 'biz', 'x', low), null)
})
