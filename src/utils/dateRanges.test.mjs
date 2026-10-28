import { test } from 'node:test'
import assert from 'node:assert/strict'
import { changePercent, previousRange } from './dateRanges.js'

test('el período anterior tiene el mismo largo y termina el día antes', () => {
  assert.deepEqual(previousRange({ from: '2026-10-01', to: '2026-10-28' }), { from: '2026-09-03', to: '2026-09-30' })
  assert.deepEqual(previousRange({ from: '2026-10-28', to: '2026-10-28' }), { from: '2026-10-27', to: '2026-10-27' })
  assert.deepEqual(previousRange({ from: '2026-01-01', to: '2026-12-31' }), { from: '2025-01-01', to: '2025-12-31' })
  assert.deepEqual(previousRange({ from: '2026-03-01', to: '2026-03-07' }), { from: '2026-02-22', to: '2026-02-28' })
  assert.equal(previousRange({ from: '2026-10-01' }), null)
})

test('el cambio en %, también desde una pérdida; sin base no hay comparación', () => {
  assert.equal(changePercent(120, 100), 20)
  assert.equal(changePercent(50, 100), -50)
  assert.equal(changePercent(-50, -100), 50)
  assert.equal(changePercent(100, 0), null)
  assert.equal(changePercent('80', '100'), -20)
})
