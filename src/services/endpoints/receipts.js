import api from '../api'

export const receiptsApi = {
  getAll:  (params) => api.get('/receipts', { params }),
  getById: (id)     => api.get(`/receipts/${id}`),
}
