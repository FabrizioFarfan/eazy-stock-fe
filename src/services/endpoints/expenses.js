import api from '../api'

// Gastos que no son mercadería (William, 10-oct-2026). Solo dueño.
export const expensesApi = {
  list:   (params)     => api.get('/expenses', { params }),          // { from?, to?, businessId? }
  create: (data)       => api.post('/expenses', data),               // { day?, amount, category?, concept, supplierId?, paymentMethod?, notes? }
  update: (id, data)   => api.put(`/expenses/${id}`, data),
  remove: (id, params) => api.delete(`/expenses/${id}`, { params }),
}

// Gastos fijos (Frank, 4-nov-2026): alquiler, luz, sueldo… se registran solos el día del mes que toca. Solo dueño.
export const recurringExpensesApi = {
  list:   (params)     => api.get('/expenses/recurring', { params }),
  create: (data)       => api.post('/expenses/recurring', data),      // { concept, amount, category, supplierId?, paymentMethod?, notes?, dayOfMonth, active?, businessId? }
  update: (id, data, params) => api.put(`/expenses/recurring/${id}`, data, { params }),
  remove: (id, params) => api.delete(`/expenses/recurring/${id}`, { params }),
}
