import api from '../api'

export const tutorialsApi = {
  getSeen: () => api.get('/me/tutorials'),
  // returns ["eazystock_stock_help_v1", ...]

  markSeen: (keys) => api.post('/me/tutorials', { keys }),
  // merge idempotente; acepta batch (para migrar flags viejos de localStorage)
}
