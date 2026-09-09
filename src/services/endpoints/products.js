import api from '../api'

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  // params: { page, size, search, lowStock, active, businessId }

  getById: (id) => api.get(`/products/${id}`),

  create: (data) => api.post('/products', data),

  // ¿Ya tengo un producto con este nombre? Chequeo en vivo del formulario
  // (William creó «Waype Kg Blanco» dos veces). params: { name, supplierId, excludeId }
  checkName: (params) => api.get('/products/check-name', { params }),

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
  units: (params) => api.get('/products/units', { params }),

  // Borrado masivo por rango de fecha de creación (from/to en formato YYYY-MM-DD)
  bulkDeletePreview: (from, to) =>
    api.get('/products/bulk-delete/preview', { params: { from, to } }),
  bulkDelete: (from, to) => api.post('/products/bulk-delete', { from, to }),

  // Foto del producto: el BE guarda una versión grande (detalle) y una miniatura
  // (listas). `file` ya viene reducido por utils/productImage.shrinkImage.
  uploadImage: (id, file, params) => {
    const form = new FormData()
    form.append('file', file, file.name || 'foto.jpg')
    return api.post(`/products/${id}/image`, form, { params, headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deleteImage: (id, params) => api.delete(`/products/${id}/image`, { params }),

  getQr:      (id) => api.get(`/products/${id}/qr`,      { responseType: 'blob' }),
  getBarcode: (id) => api.get(`/products/${id}/barcode`, { responseType: 'blob' }),

  scanCode: (code) => api.get(`/products/scan/${code}`),
}
