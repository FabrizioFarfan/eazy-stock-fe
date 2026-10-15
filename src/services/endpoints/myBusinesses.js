import api from '../api'

/**
 * Negocios del dueño (M1 «Varios negocios por dueño», 15-oct-2026). Solo OWNER.
 * La suscripción es de la CUENTA del dueño: Basic = 1 negocio, Pro/AI = ilimitados.
 */
export const myBusinessesApi = {
  // [{ id, name, countryCode, currency, phone, active, createdAt, current, employeesActive }]
  list:     () => api.get('/me/businesses'),
  // { name, countryCode, currency?, phone? } → 201 negocio | 403 PLAN_LIMIT
  create:   (data) => api.post('/me/businesses', data),
  // → { accessToken, refreshToken, type, user } (el token lleva el businessId: se reemite)
  switchTo: (id) => api.post(`/me/businesses/${id}/switch`),
  // { from, to, businesses: [{ id, name, countryCode, currency, current, salesTotal, salesCount,
  //   receivablesOutstanding, payablesOutstanding, stockValueCost, lowStockCount, employeesActive, lastSaleAt }],
  //   totals: [{ currency, businesses, salesTotal, salesCount, receivablesOutstanding, payablesOutstanding, stockValueCost }] }
  overview: (params) => api.get('/me/businesses/overview', { params }),
}
