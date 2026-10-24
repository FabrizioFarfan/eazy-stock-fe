import api from '../api'

/**
 * Medios de pago del negocio (multi-país, API 1.13.0). Todo va filtrado por el
 * negocio del usuario. Lista: [{ id, name, active, sortOrder, cash, usedInSales }].
 */
export const paymentMethodsApi = {
  list:    (params) => api.get('/payment-methods', { params }),     // { includeInactive? }
  create:  (data)   => api.post('/payment-methods', data),          // { name } → 201 | 409 PAYMENT_METHOD_DUPLICATE
  update:  (id, data) => api.put(`/payment-methods/${id}`, data),   // { name?, active? } | 400 PAYMENT_METHOD_CASH_REQUIRED
  reorder: (ids)    => api.put('/payment-methods/order', { ids }),  // → lista reordenada
  remove:  (id)     => api.delete(`/payment-methods/${id}`),        // 204 | 409 PAYMENT_METHOD_IN_USE | 400 (efectivo)
}
