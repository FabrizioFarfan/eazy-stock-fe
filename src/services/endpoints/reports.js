import api from '../api'

export const reportsApi = {
  getSalesByProduct:  (params) => api.get('/reports/sales/by-product',  { params }),
  getSalesByProvider: (params) => api.get('/reports/sales/by-provider', { params }),
  getDailySummary:    (params) => api.get('/reports/daily-summary',     { params }),
  getLowStock:        (params) => api.get('/reports/low-stock',         { params }),

  // Bloque 4: reporte unificado de ventas con filtros combinables
  // params: { from?, to?, supplierId?, brandId?, employeeId?, businessId?, page?, size? }
  getSalesReport: (params) => api.get('/reports/sales', { params }),

  // Detalle de una venta para el modal (reutiliza endpoint de sales)
  getSaleDetail: (id) => api.get(`/sales/${id}`),

  // Resurtido por proveedor: params = { supplierId, from, to, businessId? }
  getSupplierRestock: (params) => api.get('/reports/supplier-restock', { params }),

  // Rendimiento de vendedores: params = { from?, to?, businessId? }
  getSellerPerformance: (params) => api.get('/reports/seller-performance', { params }),

  // Bloque 4 — Paso 4: cuentas por cobrar y cuentas por pagar
  getReceivables: (params) => api.get('/reports/receivables', { params }),
  getPayables:    (params) => api.get('/reports/payables',    { params }),
}
