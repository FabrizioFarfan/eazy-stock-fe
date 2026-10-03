import api from '../api'

export const supplierTransactionsApi = {
  getAll:     (supplierId, params) => api.get(`/suppliers/${supplierId}/transactions`, { params }),
  // Pagos a TODOS los proveedores por período (solo dueño): params { from?, to?, type?, page?, size?, businessId? }
  getAllForBusiness: (params) => api.get('/suppliers/transactions', { params }),
  summary:           (params) => api.get('/suppliers/transactions/summary', { params }),
  addDebt:    (supplierId, data)   => api.post(`/suppliers/${supplierId}/transactions/debt`,       data),
  payment:    (supplierId, data)   => api.post(`/suppliers/${supplierId}/transactions/payment`,    data),
  adjustment: (supplierId, data)   => api.post(`/suppliers/${supplierId}/transactions/adjustment`, data),
}
