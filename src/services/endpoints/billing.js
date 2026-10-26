import api from '../api'

/**
 * Pago con tarjeta vía Stripe (M2, 15-oct-2026). Solo si `stripeEnabled` en
 * GET /me/subscription (la cuenta Stripe es la de Fabrizio / Eazy Life).
 */
export const billingApi = {
  // { plan: 'BASIC'|'PRO', interval: 'MONTHLY'|'QUARTERLY'|'YEARLY', keep?: { businessIds, employeeIds } }
  // → { url } (Stripe Checkout; AI llega pronto). Bajar de plan con needsSelection sin keep →
  // 400 KEEP_SELECTION_REQUIRED; keep fuera de los límites → 400 KEEP_SELECTION_INVALID (API 1.16.0).
  // API 1.17.0 (STRIPE-SPEC.md): en prueba vigente es Checkout en modo setup (guarda la tarjeta,
  // no cobra hasta trialEndsAt) y acepta `promotionCode` (400 PROMO_CODE_INVALID); sin prueba
  // cobra hoy. Con suscripción de Stripe activa → 409 (usar changePlan).
  checkout: (data) => api.post('/billing/checkout', data),
  // { plan, interval, keep? } → cambia el plan pagando (prorrateo: se cobra o abona la diferencia
  // hoy; 402 PAYMENT_FAILED si el cobro falla y no cambia nada) o, con tarjeta guardada en la
  // prueba, el precio del primer cobro (sin cobrar). Mismas reglas de keep. Sin nada en Stripe → 409.
  changePlan: (data) => api.post('/billing/change-plan', data),
  // → { url } (portal del cliente: tarjeta, facturas, cancelar)
  portal:   () => api.post('/billing/portal'),
}
