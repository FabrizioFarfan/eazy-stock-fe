import api from '../api'

export const receiptsApi = {
  getAll:  (params) => api.get('/receipts', { params }),
  getById: (id)     => api.get(`/receipts/${id}`),
  // Factura / guía unívoca por proveedor (pedido de William)
  checkReference:  (params)              => api.get('/receipts/check-reference', { params }),
  updateReference: (id, referenceDocument) => api.patch(`/receipts/${id}/reference`, { referenceDocument }),
  annulPreview:    (id)                  => api.get(`/receipts/${id}/annul-preview`),
  annul:           (id)                  => api.delete(`/receipts/${id}`),
}
