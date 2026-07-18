import api from '../api'

/**
 * Endpoints del import masivo de productos.
 *
 * Flow:
 *   upload(file)            → { jobId, headers, suggestedMapping, ... }
 *   submitMapping(id, body) → 200 OK
 *   preview(id, { page, size }) → { rows, totalRows, green/yellow/red }
 *   execute(id)             → 202 Accepted
 *   getStatus(id)           → status + counters
 *   downloadReport(id)      → blob (xlsx)
 */
export const importsApi = {
  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/products/import/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Historial de imports del negocio (últimos 50, más recientes primero)
  history: () => api.get('/products/import/history'),

  submitMapping: (jobId, body) =>
    api.post(`/products/import/${jobId}/mapping`, body),

  preview: (jobId, params) =>
    api.get(`/products/import/${jobId}/preview`, { params }),

  execute: (jobId) =>
    api.post(`/products/import/${jobId}/execute`),

  getStatus: (jobId) =>
    api.get(`/products/import/${jobId}/status`),

  downloadReport: (jobId) =>
    api.get(`/products/import/${jobId}/report`, { responseType: 'blob' }),
}
