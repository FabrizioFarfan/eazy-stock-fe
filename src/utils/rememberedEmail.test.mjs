import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readRememberedEmail, rememberEmailEnabled, saveRememberedEmail } from './rememberedEmail.js'

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), size: () => m.size } }

test('sin nada guardado: correo vacío y la casilla marcada', () => {
  const s = memory()
  assert.equal(readRememberedEmail(s), '')
  assert.equal(rememberEmailEnabled(s), true)
})

test('con la casilla, el correo queda guardado (sin espacios) y vuelve al abrir el login', () => {
  const s = memory()
  saveRememberedEmail('  william@ferrefano.pe ', true, s)
  assert.equal(readRememberedEmail(s), 'william@ferrefano.pe')
  assert.equal(rememberEmailEnabled(s), true)
})

test('sin la casilla no queda ningún correo en el aparato y la elección se recuerda', () => {
  const s = memory()
  saveRememberedEmail('william@ferrefano.pe', true, s)
  saveRememberedEmail('william@ferrefano.pe', false, s)
  assert.equal(readRememberedEmail(s), '')
  assert.equal(rememberEmailEnabled(s), false)
  saveRememberedEmail('otro@tienda.pe', true, s)
  assert.equal(readRememberedEmail(s), 'otro@tienda.pe')
  assert.equal(rememberEmailEnabled(s), true)
})

test('un correo vacío no pisa el que ya estaba', () => {
  const s = memory()
  saveRememberedEmail('william@ferrefano.pe', true, s)
  saveRememberedEmail('   ', true, s)
  assert.equal(readRememberedEmail(s), 'william@ferrefano.pe')
})

test('con el almacenamiento bloqueado no falla', () => {
  const broken = { getItem: () => { throw new Error('no') }, setItem: () => { throw new Error('no') }, removeItem: () => { throw new Error('no') } }
  assert.equal(readRememberedEmail(broken), '')
  assert.equal(rememberEmailEnabled(broken), true)
  saveRememberedEmail('a@b.c', true, broken)
})
