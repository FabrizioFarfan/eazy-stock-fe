// Analítica de la web pública: qué cuenta, qué botón es y qué se respeta.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPublicPath, normalizePath, utmFrom, clickLabel, optedOut } from './analytics.js'

test('solo cuentan las páginas públicas, nunca la app', () => {
  assert.equal(isPublicPath('/'), true)
  assert.equal(isPublicPath('/planes/'), true)
  assert.equal(isPublicPath('/registro?plan=PRO'), true)
  assert.equal(isPublicPath('/dashboard'), false)
  assert.equal(isPublicPath('/boss'), false)
  assert.equal(normalizePath('/planes/'), '/planes')
})

test('utm del enlace en minúsculas; lo raro no pasa', () => {
  assert.deepEqual(utmFrom('?utm_source=Instagram&utm_campaign=fabrizio_oct&utm_medium=<script>'),
    { utmSource: 'instagram', utmMedium: undefined, utmCampaign: 'fabrizio_oct' })
  assert.deepEqual(utmFrom(''), { utmSource: undefined, utmMedium: undefined, utmCampaign: undefined })
})

test('qué botón: data-track primero, luego adónde lleva; lo demás no cuenta', () => {
  assert.equal(clickLabel({ track: 'Hero · Probar gratis' }), 'hero_probar_gratis')
  assert.equal(clickLabel({ href: 'https://wa.me/4915511384643?text=hola' }), 'whatsapp')
  assert.equal(clickLabel({ href: '/registro?plan=BASIC' }), 'go_register')
  assert.equal(clickLabel({ href: 'https://eazy-stock.com/planes' }), 'go_plans')
  assert.equal(clickLabel({ href: '/login' }), 'go_login')
  assert.equal(clickLabel({ href: '/para-quien' }), 'go_para_quien')
  assert.equal(clickLabel({ href: '#funciones' }), null)
  assert.equal(clickLabel({}), null)
})

test('se respeta «no me sigas»', () => {
  assert.equal(optedOut({ doNotTrack: '1' }), true)
  assert.equal(optedOut({ globalPrivacyControl: true }), true)
  assert.equal(optedOut({ doNotTrack: 'unspecified' }), false)
})
