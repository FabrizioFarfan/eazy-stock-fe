// Pago con tarjeta en Tu plan (web 1.24.0 · API 1.17.0, STRIPE-SPEC.md §2, §4, §8). Lógica pura
// (sin imports, se prueba con node --test): qué modo de pago toca, qué hace el botón del plan
// elegido y qué se manda al API. El API manda; esto solo refleja sus reglas en la pantalla.

/** Margen del API: la prueba cuenta como vigente si termina más tarde que ahora + 1 h. */
export const TRIAL_MARGIN_MS = 60 * 60 * 1000

const ENDED = ['CANCELED', 'EXPIRED']

/**
 * Modo de pago de la cuenta:
 *  - 'subscription': paga con una suscripción de Stripe activa → cambiar de plan = change-plan (prorrateo).
 *  - 'cardOnFile':   prueba con la tarjeta guardada (schedule) → change-plan sin cobro.
 *  - 'setup':        prueba vigente sin tarjeta → Checkout «Guardar tarjeta» (no cobra hasta trialEndsAt).
 *  - 'pay':          sin prueba vigente → Checkout que cobra hoy.
 */
export function billingMode(sub, now = Date.now()) {
  if (!sub) return 'pay'
  if (sub.stripeSubscriptionId && !ENDED.includes(sub.status)) return 'subscription'
  if (sub.cardOnFile) return 'cardOnFile'
  if (trialRunning(sub, now)) return 'setup'
  return 'pay'
}

/** ¿Prueba vigente para Checkout en modo setup? (TRIAL y trialEndsAt > ahora + 1 h) */
export function trialRunning(sub, now = Date.now()) {
  if (sub?.status !== 'TRIAL' || !sub.trialEndsAt) return false
  const end = new Date(sub.trialEndsAt).getTime()
  return Number.isFinite(end) && end > now + TRIAL_MARGIN_MS
}

const up = (s) => String(s ?? '').toUpperCase()

/**
 * Qué hace el botón con el plan/intervalo elegidos: 'checkout' (setup o pay), 'changePlan'
 * (subscription o cardOnFile con otra combinación) o 'none' (ya es lo que tiene).
 */
export function planAction(sub, plan, interval, now = Date.now()) {
  const mode = billingMode(sub, now)
  if (mode === 'setup' || mode === 'pay') return 'checkout'
  const sameInterval = !sub.interval || up(sub.interval) === up(interval)
  return up(sub.plan) === up(plan) && sameInterval ? 'none' : 'changePlan'
}

/** Código promocional limpio (sin espacios a los lados); vacío → null. */
export function cleanPromoCode(code) {
  const c = String(code ?? '').trim()
  return c ? c : null
}

/**
 * Cuerpo de POST /billing/checkout y POST /billing/change-plan: { plan, interval, keep?, promotionCode? }.
 * `promotionCode` solo va en Checkout de modo setup (en modo pay lo pide Stripe).
 */
export function billingPayload({ plan, interval, keep, promotionCode } = {}) {
  const body = { plan: up(plan), interval: up(interval) }
  if (keep) body.keep = keep
  const code = cleanPromoCode(promotionCode)
  if (code) body.promotionCode = code
  return body
}

/** Id de cupón para PUT /boss/subscriptions/{id}/coupon: limpio, vacío → null (quitar). */
export function couponPayload(couponId) {
  const c = String(couponId ?? '').trim()
  return { couponId: c ? c : null }
}
