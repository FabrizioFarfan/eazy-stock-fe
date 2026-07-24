import api from '../api'

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  // params: { page, size, search, lowStock, active, businessId }

  getById: (id) => api.get(`/products/${id}`),

  create: (data) => api.post('/products', data),

  update: (id, data) => api.put(`/products/${id}`, data),

  deactivate: (id) => api.delete(`/products/${id}`),

  // Camino de vuelta: devuelve al catálogo un producto oculto, con su mismo código
  reactivate: (id) => api.post(`/products/${id}/reactivate`),

  // Borrado definitivo: solo productos sin ventas ni recepciones (409 si tienen historial)
  checkDeletable: (id) => api.get(`/products/${id}/deletable`),
  deletePermanently: (id) => api.delete(`/products/${id}/permanent`),

  // Borrado FORZADO en cascada: para productos de prueba atrapados por tener historial.
  // El preview cuenta el impacto (ventas/fiado/recepciones + colateral); force lo ejecuta.
  forceDeletePreview: (id) => api.get(`/products/${id}/force-delete/preview`),
  forceDelete: (id) => api.delete(`/products/${id}/force`),

  // Huecos reutilizables en la numeración: códigos de productos borrados que
  // nunca tuvieron movimientos. Se sugieren al dar de alta un producto nuevo.
  freeCodes: () => api.get('/products/free-codes'),

  // Borrado masivo por rango de fecha de creación (from/to en formato YYYY-MM-DD)
  bulkDeletePreview: (from, to) =>
    api.get('/products/bulk-delete/preview', { params: { from, to } }),
  bulkDelete: (from, to) => api.post('/products/bulk-delete', { from, to }),

  getQr:      (id) => api.get(`/products/${id}/qr`,      { responseType: 'blob' }),
  getBarcode: (id) => api.get(`/products/${id}/barcode`, { responseType: 'blob' }),

  scanCode: (code) => api.get(`/products/scan/${code}`),
}
