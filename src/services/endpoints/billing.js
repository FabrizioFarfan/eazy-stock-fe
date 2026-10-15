import api from '../api'

/**
 * Pago con tarjeta vía Stripe (M2, 15-oct-2026). Solo si `stripeEnabled` en
 * GET /me/subscription (la cuenta Stripe es la de Fabrizio / Eazy Life).
 */
export const billingApi = {
  // { plan: 'BASIC'|'PRO'|'AI', interval: 'MONTHLY'|'YEARLY' } → { url } (Stripe Checkout)
  checkout: (data) => api.post('/billing/checkout', data),
  // → { url } (portal del cliente: tarjeta, facturas, cancelar)
  portal:   () => api.post('/billing/portal'),
}
