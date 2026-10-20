import api from '../api'

/**
 * Pago con tarjeta vía Stripe (M2, 15-oct-2026). Solo si `stripeEnabled` en
 * GET /me/subscription (la cuenta Stripe es la de Fabrizio / Eazy Life).
 */
export const billingApi = {
  // { plan: 'BASIC'|'PRO', interval: 'MONTHLY'|'QUARTERLY'|'YEARLY' } → { url } (Stripe Checkout; AI llega pronto)
  checkout: (data) => api.post('/billing/checkout', data),
  // → { url } (portal del cliente: tarjeta, facturas, cancelar)
  portal:   () => api.post('/billing/portal'),
}
