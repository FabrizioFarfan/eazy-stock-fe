import api from '../api'

/**
 * «Carga tu inventario con fotos» (API 1.30.0, 21-nov-2026). Pide «Gestionar productos».
 *
 *   status()            → { enabled, maxPhotos, limitScope: 'LIFETIME'|'DAILY', limitMax, used, remaining, pending }
 *   create()            → { id, status: 'UPLOADING' }        403 PHOTO_LOAD_LIMIT · 503 AI_UNAVAILABLE
 *   addPhoto(id, file)  → una foto por petición (nginx corta a 1 MB)
 *   analyze(id)         → responde enseguida con ANALYZING
 *   get(id)             → { status, errorMessage, items: [{ ref, name, category, unit, brand, barcode, salePrice,
 *                           quantity, confidence: 'HIGH'|'MEDIUM'|'LOW', photo, existing: { id, name, salePrice,
 *                           priceIsVariable, currentStock } | null }] }
 *   confirm(id, body)   → { created, updated, failed: [{ name, reason }] }
 *   discard(id)
 */
export const photoLoadsApi = {
  status: () => api.get('/photo-loads/status'),
  create: () => api.post('/photo-loads'),
  addPhoto: (id, file) => {
    const fd = new FormData()
    fd.append('file', file, file.name || 'foto.jpg')
    return api.post(`/photo-loads/${id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  analyze: (id) => api.post(`/photo-loads/${id}/analyze`),
  get: (id) => api.get(`/photo-loads/${id}`),
  confirm: (id, body) => api.post(`/photo-loads/${id}/confirm`, body),
  discard: (id) => api.delete(`/photo-loads/${id}`),
}
