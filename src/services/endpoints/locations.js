import api from '../api'

// Ubicaciones físicas del negocio (almacén, estante, vitrina…). Mismo contrato
// que marcas/categorías; cada fila trae `productCount` (productos activos).
export const locationsApi = {
  getAll:  (params) => api.get('/locations', { params }),
  getById: (id)     => api.get(`/locations/${id}`),
  create:  (data)   => api.post('/locations', data),
  update:  (id, data, params) => api.put(`/locations/${id}`, data, { params }),
  remove:  (id, params) => api.delete(`/locations/${id}`, { params }),
}
