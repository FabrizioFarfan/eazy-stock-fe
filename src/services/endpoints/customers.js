import api from '../api'

export const customersApi = {
  getAll:   (params)      => api.get('/customers', { params }),
  getById:  (id)          => api.get(`/customers/${id}`),
  create:   (data)        => api.post('/customers', data),
  update:   (id, data)    => api.put(`/customers/${id}`, data),
  remove:   (id)          => api.delete(`/customers/${id}`),

  getTransactions: (id, params) => api.get(`/customers/${id}/transactions`, { params }),
  payment:         (id, data)   => api.post(`/customers/${id}/transactions/payment`,    data),
  adjustment:      (id, data)   => api.post(`/customers/${id}/transactions/adjustment`, data),
}
