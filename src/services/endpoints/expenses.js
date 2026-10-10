import api from '../api'

// Gastos que no son mercadería (William, 10-oct-2026). Solo dueño.
export const expensesApi = {
  list:   (params)     => api.get('/expenses', { params }),          // { from?, to?, businessId? }
  create: (data)       => api.post('/expenses', data),               // { day?, amount, category?, concept, supplierId?, paymentMethod?, notes? }
  update: (id, data)   => api.put(`/expenses/${id}`, data),
  remove: (id, params) => api.delete(`/expenses/${id}`, { params }),
}
