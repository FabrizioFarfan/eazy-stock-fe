import api from '../api'

/**
 * Endpoints del export masivo de productos.
 *
 * Flow:
 *   start(body)             → { jobId, status, format, ... }
 *   getStatus(jobId)        → { status, totalProducts, fileName, ... }
 *   download(jobId)         → blob (xlsx o csv)
 */
export const exportsApi = {
  start: (body) =>
    api.post('/products/export', body),

  getStatus: (jobId) =>
    api.get(`/products/export/${jobId}/status`),

  download: (jobId) =>
    api.get(`/products/export/${jobId}/download`, { responseType: 'blob' }),
}
