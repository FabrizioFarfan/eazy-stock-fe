import api from '../api'

/**
 * Pago con tarjeta vía Stripe (M2, 15-oct-2026). Solo si `stripeEnabled` en
 * GET /me/subscription (la cuenta Stripe es la de Fabrizio / Eazy Life).
 */
export const billingApi = {
  // { plan: 'BASIC'|'PRO', interval: 'MONTHLY'|'QUARTERLY'|'YEARLY', keep?: { businessIds, employeeIds } }
  // → { url } (Stripe Checkout; AI llega pronto). Bajar de plan con needsSelection sin keep →
  // 400 KEEP_SELECTION_REQUIRED; keep fuera de los límites → 400 KEEP_SELECTION_INVALID (API 1.16.0).
  checkout: (data) => api.post('/billing/checkout', data),
  // → { url } (portal del cliente: tarjeta, facturas, cancelar)
  portal:   () => api.post('/billing/portal'),
}
