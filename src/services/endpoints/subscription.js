import api from '../api'

/**
 * Planes y suscripción (M1 «Planes en serio», 15-oct-2026).
 * GET /plans es público (catálogo + prueba + descuento de lanzamiento);
 * GET /me/subscription devuelve el estado del negocio del usuario logueado.
 */
export const subscriptionApi = {
  getPlans: () => api.get('/plans'),
  getMine:  () => api.get('/me/subscription'),
  // { ownerId, plan: 'BASIC'|'PRO'|'AI', status: 'TRIAL'|'ACTIVE'|'PAST_DUE'|'EXPIRED'|'CANCELED',
  //   trialEndsAt, paidUntil, daysLeft, listPriceMonthly, discountPercent, discountUntil,
  //   customPriceMonthly, priceMonthly, currency, launchPriceLocked, readOnly, maxEmployees, note,
  //   maxBusinesses, businessesCount, stripeEnabled, stripeSubscriptionId, interval: 'MONTHLY'|'YEARLY'|null }
}
