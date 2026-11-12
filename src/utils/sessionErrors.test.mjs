import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isTransientFailure, reconnectDelay, sessionGoneError } from './sessionErrors.js'

const http = (status) => ({ response: { status } })

test('sin respuesta (red caída o API reiniciando) es pasajero: la sesión se conserva', () => {
  assert.equal(isTransientFailure(new Error('Network Error')), true)
  assert.equal(isTransientFailure({ code: 'ERR_NETWORK' }), true)
  assert.equal(isTransientFailure(undefined), true)
})

test('502/503/504 del despliegue, 500, 408 y 429 son pasajeros', () => {
  for (const s of [500, 502, 503, 504, 408, 429]) assert.equal(isTransientFailure(http(s)), true, String(s))
})

test('el API rechazando la sesión (401/403) u otro 4xx no es pasajero', () => {
  for (const s of [400, 401, 403, 404]) assert.equal(isTransientFailure(http(s)), false, String(s))
})

test('una sesión que ya no está en el navegador cuenta como rechazo, no como corte', () => {
  assert.equal(isTransientFailure(sessionGoneError()), false)
})

test('la espera crece 2 s, 4 s, 8 s y se queda en 15 s', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 20].map(reconnectDelay), [2000, 4000, 8000, 15000, 15000, 15000])
  assert.equal(reconnectDelay(-1), 2000)
})
