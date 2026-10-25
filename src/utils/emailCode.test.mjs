// Pantalla del código de 6 dígitos (EMAIL-CODE-SPEC.md): casillas, errores por código y reenvío.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyDigits, fillDigits, backspaceDigits, isComplete, retryAfterOf, codeErrorMessage, clearsDigits,
  resendState, formatCountdown, CODE_TTL_MS,
} from './emailCode.js'

const t = (k, v) => (v ? k.replace(/\{(\w+)\}/g, (_, x) => v[x]) : k)

test('un dígito va a su casilla y el foco pasa a la siguiente', () => {
  const { digits, focus } = fillDigits(emptyDigits(), 2, '7')
  assert.deepEqual(digits, ['', '', '7', '', '', ''])
  assert.equal(focus, 3)
})

test('pegar el código entero rellena las 6 desde la primera, aunque se pegue en otra', () => {
  const { digits, focus } = fillDigits(emptyDigits(), 3, ' 123-456 ')
  assert.deepEqual(digits, ['1', '2', '3', '4', '5', '6'])
  assert.equal(focus, 5)
  assert.equal(isComplete(digits), true)
})

test('pegar parte del código rellena desde la casilla y no se pasa', () => {
  const { digits } = fillDigits(['9', '', '', '', '', ''], 4, '123')
  assert.deepEqual(digits, ['9', '', '', '', '1', '2'])
})

test('lo que no es dígito se ignora', () => {
  assert.deepEqual(fillDigits(emptyDigits(), 0, 'a').digits, emptyDigits())
})

test('borrar con la casilla vacía vuelve a la anterior y la borra', () => {
  const r = backspaceDigits(['1', '2', '', '', '', ''], 2)
  assert.deepEqual(r.digits, ['1', '', '', '', '', ''])
  assert.equal(r.focus, 1)
  const r2 = backspaceDigits(['1', '2', '', '', '', ''], 1)
  assert.deepEqual(r2.digits, ['1', '', '', '', '', ''])
  assert.equal(r2.focus, 1)
  assert.equal(backspaceDigits(emptyDigits(), 0).focus, 0)
})

test('incompleto no se envía', () => assert.equal(isComplete(['1', '2', '3', '4', '5', '']), false))

test('errores por código, traducibles', () => {
  assert.equal(codeErrorMessage(t, { code: 'INVALID_CODE', attemptsLeft: 3 }), 'El código no es correcto. Te quedan 3 intentos.')
  assert.equal(codeErrorMessage(t, { code: 'INVALID_CODE', attemptsLeft: 1 }), 'El código no es correcto. Te queda 1 intento.')
  assert.equal(codeErrorMessage(t, { code: 'CODE_LOCKED' }), 'Fallaste 5 veces. Pide un código nuevo.')
  assert.equal(codeErrorMessage(t, { code: 'CODE_EXPIRED' }), 'El código caducó. Pide uno nuevo.')
  assert.equal(codeErrorMessage(t, { code: 'RESEND_TOO_SOON', retryAfterSeconds: 42 }), 'Espera 42 segundos para pedir otro código.')
  assert.equal(codeErrorMessage(t, { code: 'TOO_MANY_REQUESTS', retryAfterSeconds: 1500 }), 'Pediste demasiados códigos. Prueba de nuevo en 25 minutos.')
  assert.equal(codeErrorMessage(t, { code: 'TOO_MANY_REQUESTS', retryAfterSeconds: 10 }), 'Pediste demasiados códigos. Prueba de nuevo en 1 minutos.')
  assert.equal(codeErrorMessage(t, { code: 'NOT_FOUND' }), null)
})

test('vaciar casillas solo cuando el código ya no sirve', () => {
  assert.equal(clearsDigits('INVALID_CODE'), true)
  assert.equal(clearsDigits('CODE_LOCKED'), true)
  assert.equal(clearsDigits('CODE_EXPIRED'), true)
  assert.equal(clearsDigits('TOO_MANY_REQUESTS'), false)
})

test('retryAfterSeconds', () => {
  assert.equal(retryAfterOf({ retryAfterSeconds: 59.2 }), 60)
  assert.equal(retryAfterOf({}), null)
  assert.equal(retryAfterOf({ retryAfterSeconds: 0 }), null)
})

test('al abrir: sin envío conocido o de hace más de 15 min → pide uno; si no, cuenta atrás', () => {
  const now = 1_000_000_000
  assert.deepEqual(resendState(null, now), { autoSend: true, wait: 0 })
  assert.deepEqual(resendState(now - CODE_TTL_MS, now), { autoSend: true, wait: 0 })
  assert.deepEqual(resendState(now - 20_000, now), { autoSend: false, wait: 40 })
  assert.deepEqual(resendState(now - 5 * 60_000, now), { autoSend: false, wait: 0 })
})

test('cuenta atrás m:ss', () => {
  assert.equal(formatCountdown(60), '1:00')
  assert.equal(formatCountdown(9), '0:09')
  assert.equal(formatCountdown(-3), '0:00')
})
