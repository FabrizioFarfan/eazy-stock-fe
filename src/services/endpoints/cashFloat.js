import api from '../api'

// Fondo de caja del día: el sencillo que el dueño entrega para dar vuelto.
// GET lo ve todo el negocio; POST/PUT/DELETE solo el dueño.
export const cashFloatApi = {
  getDay: (params) => api.get('/cash-float', { params }),          // { date?, businessId? }
  register: (data) => api.post('/cash-float', data),               // { day?, amount, kind?, note?, assignedToId? }
  update: (id, data) => api.put(`/cash-float/${id}`, data),
  remove: (id, params) => api.delete(`/cash-float/${id}`, { params }),
}
