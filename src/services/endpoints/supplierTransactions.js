import api from '../api'

export const supplierTransactionsApi = {
  getAll:     (supplierId, params) => api.get(`/suppliers/${supplierId}/transactions`, { params }),
  addDebt:    (supplierId, data)   => api.post(`/suppliers/${supplierId}/transactions/debt`,       data),
  payment:    (supplierId, data)   => api.post(`/suppliers/${supplierId}/transactions/payment`,    data),
  adjustment: (supplierId, data)   => api.post(`/suppliers/${supplierId}/transactions/adjustment`, data),
}
