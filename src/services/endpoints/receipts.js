import api from '../api'

export const receiptsApi = {
  getAll:  (params) => api.get('/receipts', { params }),
  getById: (id)     => api.get(`/receipts/${id}`),
  // Factura / guía unívoca por proveedor (pedido de William)
  checkReference:  (params)              => api.get('/receipts/check-reference', { params }),
  updateReference: (id, referenceDocument) => api.patch(`/receipts/${id}/reference`, { referenceDocument }),
  annulPreview:    (id)                  => api.get(`/receipts/${id}/annul-preview`),
  annul:           (id)                  => api.delete(`/receipts/${id}`),
  // Devolver al proveedor parte de lo recibido. body: { items: [{ productId, quantity }], notes }
  // Parámetros de los productos de la factura (William, 7-nov-2026). body: { items: [{ productId, values: { nombre: valor } }] }
  parameters:       (id)                  => api.get(`/receipts/${id}/parameters`),
  updateParameters: (id, items)           => api.put(`/receipts/${id}/parameters`, { items }),
  returnItems:     (id, data)            => api.post(`/receipts/${id}/returns`, data),
  // Entrada simple del vendedor (sin precios). body: { supplierId, items: [{ productId, quantity }], referenceDocument, notes }
  createSimple:    (data)                => api.post('/receipts/simple', data),
  // El dueño completa el costo. body: { items: [{ productId, unitCost, salePrice }], totalAmount, paymentMode, referenceDocument, notes }
  completeCost:    (id, data)            => api.post(`/receipts/${id}/cost`, data),
}
