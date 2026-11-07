// Panel Boss › Visitas: embudo, conversión y eje.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { funnelRows, conversion, axisTicks, groupLive } from './visits.js'

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

test('en vivo: una fila por visita, con lo que hizo en orden y la más reciente primero', () => {
  const now = Date.parse('2026-11-07T12:00:00Z')
  const rows = groupLive([
    { at: '2026-11-07T11:59:00Z', visitor: 'a', name: 'click', path: '/apps', label: 'tester_signup_ios', country: 'IT', device: 'mobile' },
    { at: '2026-11-07T11:58:30Z', visitor: 'a', name: 'pageview', path: '/apps', country: 'IT', device: 'mobile' },
    { at: '2026-11-07T11:58:10Z', visitor: 'a', name: 'pageview', path: '/apps', country: 'IT', device: 'mobile' },
    { at: '2026-11-07T11:58:00Z', visitor: 'a', name: 'pageview', path: '/', country: 'IT', device: 'mobile', source: 'instagram' },
    { at: '2026-11-07T10:00:00Z', visitor: 'b', name: 'pageview', path: '/', country: 'PE', device: 'desktop' },
  ], now)
  assert.deepEqual(rows.map((r) => r.visitor), ['a', 'b'])
  assert.deepEqual(rows[0].steps.map((s) => s.path), ['/', '/apps', '/apps'])
  assert.equal(rows[0].steps[2].label, 'tester_signup_ios')
  assert.equal(rows[0].source, 'instagram')
  assert.equal(rows[0].online, true)
  assert.equal(rows[1].online, false)
  assert.deepEqual(groupLive(null), [])
})
