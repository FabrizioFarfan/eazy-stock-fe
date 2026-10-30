// Panel Boss › Visitas: embudo, conversión y eje.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { funnelRows, conversion, axisTicks } from './visits.js'

test('el embudo: ancho sobre el primero y % sobre el anterior, topado en 100', () => {
  const rows = funnelRows([{ key: 'visited', count: 200 }, { key: 'pricing', count: 50 }, { key: 'register_open', count: 60 }, { key: 'signup', count: 0 }, { key: 'first_sale', count: 0 }])
  assert.deepEqual(rows.map((r) => r.width), [100, 25, 30, 0, 0])
  assert.deepEqual(rows.map((r) => r.ofPrevious), [null, 25, 100, 0, 0])
})

test('sin visitas no se divide por cero', () => {
  assert.deepEqual(funnelRows([{ key: 'visited', count: 0 }, { key: 'pricing', count: 0 }]).map((r) => r.width), [0, 0])
  assert.equal(conversion(3, 0), 0)
})

test('conversión con un decimal solo cuando es pequeña', () => {
  assert.equal(conversion(1, 120), 0.8)
  assert.equal(conversion(3, 20), 15)
  assert.equal(conversion(0, 50), 0)
})

test('marcas del eje: extremos y hasta tres en medio', () => {
  assert.deepEqual(axisTicks(1), [0])
  assert.deepEqual(axisTicks(7), [0, 2, 3, 5, 6])
  assert.deepEqual(axisTicks(30), [0, 7, 15, 22, 29])
})
