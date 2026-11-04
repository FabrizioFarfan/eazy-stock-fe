import api from '../api'

// Parámetros de producto (Frank, 4-nov-2026): Sí/No, opciones, número con medida o texto; el catálogo se filtra por ellos.
export const parametersApi = {
  // [{ id, name, type: 'YES_NO'|'OPTIONS'|'NUMBER'|'TEXT', unit, options: [], position, builtIn, productsCount, createdAt }]
  getAll: (params) => api.get('/parameters', { params }),
  // valores ya usados en un parámetro (sugerencias del filtro)
  values: (id, params) => api.get(`/parameters/${id}/values`, { params }),
  create: (data) => api.post('/parameters', data),                // { name, type, unit?, options?, position?, businessId? }
  update: (id, data, params) => api.put(`/parameters/${id}`, data, { params }),
  remove: (id, params) => api.delete(`/parameters/${id}`, { params }),
}
