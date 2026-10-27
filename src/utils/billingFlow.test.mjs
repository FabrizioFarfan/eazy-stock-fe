// Pago con tarjeta en Tu plan (STRIPE-SPEC.md): modo, acción del botón y payloads.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { billingMode, trialRunning, planAction, cleanPromoCode, billingPayload, couponPayload, TRIAL_MARGIN_MS } from './billingFlow.js'

const NOW = Date.parse('2026-10-26T12:00:00Z')
const inDays = (d) => new Date(NOW + d * 86400000).toISOString()

test('prueba vigente: TRIAL y más de 1 h por delante', () => {
  assert.equal(trialRunning({ status: 'TRIAL', trialEndsAt: inDays(10) }, NOW), true)
  assert.equal(trialRunning({ status: 'TRIAL', trialEndsAt: new Date(NOW + TRIAL_MARGIN_MS - 1000).toISOString() }, NOW), false)
  assert.equal(trialRunning({ status: 'TRIAL', trialEndsAt: inDays(-1) }, NOW), false)
  assert.equal(trialRunning({ status: 'TRIAL', trialEndsAt: null }, NOW), false)
  assert.equal(trialRunning({ status: 'TRIAL', trialEndsAt: 'no-date' }, NOW), false)
  assert.equal(trialRunning({ status: 'EXPIRED', trialEndsAt: inDays(10) }, NOW), false)
})

test('modo de pago', () => {
  assert.equal(billingMode(null, NOW), 'pay')
  assert.equal(billingMode({ status: 'TRIAL', trialEndsAt: inDays(20) }, NOW), 'setup')
  assert.equal(billingMode({ status: 'TRIAL', trialEndsAt: inDays(20), cardOnFile: true }, NOW), 'cardOnFile')
  assert.equal(billingMode({ status: 'EXPIRED', trialEndsAt: inDays(-3) }, NOW), 'pay')
  assert.equal(billingMode({ status: 'ACTIVE', stripeSubscriptionId: 'sub_1' }, NOW), 'subscription')
  assert.equal(billingMode({ status: 'PAST_DUE', stripeSubscriptionId: 'sub_1' }, NOW), 'subscription')
  // suscripción cancelada: se vuelve a pagar con Checkout
  assert.equal(billingMode({ status: 'CANCELED', stripeSubscriptionId: 'sub_1' }, NOW), 'pay')
  // prueba sin tarjeta pero ya casi acabada → cobra hoy
  assert.equal(billingMode({ status: 'TRIAL', trialEndsAt: new Date(NOW + 60000).toISOString() }, NOW), 'pay')
})

test('acción del botón', () => {
  const trial = { status: 'TRIAL', plan: 'PRO', trialEndsAt: inDays(20) }
  assert.equal(planAction(trial, 'PRO', 'MONTHLY', NOW), 'checkout')
  assert.equal(planAction({ status: 'EXPIRED', plan: 'PRO' }, 'BASIC', 'YEARLY', NOW), 'checkout')
  const paying = { status: 'ACTIVE', plan: 'PRO', interval: 'MONTHLY', stripeSubscriptionId: 'sub_1' }
  assert.equal(planAction(paying, 'PRO', 'MONTHLY', NOW), 'none')
  assert.equal(planAction(paying, 'pro', 'monthly', NOW), 'none')
  assert.equal(planAction(paying, 'BASIC', 'MONTHLY', NOW), 'changePlan')
  assert.equal(planAction(paying, 'PRO', 'YEARLY', NOW), 'changePlan')
  const card = { ...trial, cardOnFile: true, interval: 'QUARTERLY' }
  assert.equal(planAction(card, 'PRO', 'QUARTERLY', NOW), 'none')
  assert.equal(planAction(card, 'PRO', 'MONTHLY', NOW), 'changePlan')
  // sin intervalo conocido, mismo plan = lo que tiene
  assert.equal(planAction({ ...card, interval: null }, 'PRO', 'YEARLY', NOW), 'none')
})

test('payloads', () => {
  assert.equal(cleanPromoCode('  FUND50 '), 'FUND50')
  assert.equal(cleanPromoCode('   '), null)
  assert.equal(cleanPromoCode(undefined), null)
  assert.deepEqual(billingPayload({ plan: 'pro', interval: 'monthly' }), { plan: 'PRO', interval: 'MONTHLY' })
  assert.deepEqual(billingPayload({ plan: 'BASIC', interval: 'YEARLY', keep: { businessIds: ['b'], employeeIds: [] }, promotionCode: ' X1 ' }),
    { plan: 'BASIC', interval: 'YEARLY', keep: { businessIds: ['b'], employeeIds: [] }, promotionCode: 'X1' })
  assert.deepEqual(billingPayload({ plan: 'PRO', interval: 'MONTHLY', promotionCode: '' }), { plan: 'PRO', interval: 'MONTHLY' })
  assert.deepEqual(couponPayload(' bienvenida-10 '), { couponId: 'bienvenida-10' })
  assert.deepEqual(couponPayload(''), { couponId: null })
  assert.deepEqual(couponPayload(null), { couponId: null })
})
