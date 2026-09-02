import api from '../api'

export const customersApi = {
  getAll:   (params)      => api.get('/customers', { params }),
  getById:  (id)          => api.get(`/customers/${id}`),
  create:   (data)        => api.post('/customers', data),
  update:   (id, data, params) => api.put(`/customers/${id}`, data, { params }),
  remove:   (id, params)  => api.delete(`/customers/${id}`, { params }),

  getTransactions: (id, params) => api.get(`/customers/${id}/transactions`, { params }),
  // Estado de cuenta: cargos con productos, abonos y saldo — fuente del PDF para el deudor
  getStatement:    (id)         => api.get(`/customers/${id}/statement`),
  payment:         (id, data)   => api.post(`/customers/${id}/transactions/payment`,    data),
  adjustment:      (id, data)   => api.post(`/customers/${id}/transactions/adjustment`, data),

  // Ventas por cliente (tarea 250): compras (contado + fiado, paginado) y resumen comercial
  getSales:        (id, params) => api.get(`/customers/${id}/sales`,   { params }),
  getSummary:      (id, params) => api.get(`/customers/${id}/summary`, { params }),
}
