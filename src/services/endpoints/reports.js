import api from '../api'

export const reportsApi = {
  getSalesByProduct:  (params) => api.get('/reports/sales/by-product',  { params }),
  // params: { from, to, businessId? }

  getSalesByProvider: (params) => api.get('/reports/sales/by-provider', { params }),

  getDailySummary:    (params) => api.get('/reports/daily-summary',     { params }),
  // params: { date?, businessId? }

  getLowStock:        (params) => api.get('/reports/low-stock',         { params }),
  // params: { page, size, businessId? }
}
