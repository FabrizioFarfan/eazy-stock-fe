import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../services/endpoints/reports'

export function useDailySummary(params, options = {}) {
  return useQuery({
    queryKey: ['reports', 'daily-summary', params],
    queryFn: () => reportsApi.getDailySummary(params).then((r) => r.data.data),
    ...options,
  })
}

export function useSalesByProduct(params, options = {}) {
  return useQuery({
    queryKey: ['reports', 'sales-by-product', params],
    queryFn: () => reportsApi.getSalesByProduct(params).then((r) => r.data.data),
    ...options,
  })
}

export function useSalesByProvider(params, options = {}) {
  return useQuery({
    queryKey: ['reports', 'sales-by-provider', params],
    queryFn: () => reportsApi.getSalesByProvider(params).then((r) => r.data.data),
    ...options,
  })
}

export function useReportsLowStock(params, options = {}) {
  return useQuery({
    queryKey: ['reports', 'low-stock', params],
    queryFn: () => reportsApi.getLowStock(params).then((r) => r.data.data),
    ...options,
  })
}

export function useSalesReport(params, options = {}) {
  return useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: () => reportsApi.getSalesReport(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useSupplierRestock(params, options = {}) {
  return useQuery({
    queryKey: ['reports', 'supplier-restock', params],
    queryFn: () => reportsApi.getSupplierRestock(params).then((r) => r.data.data),
    enabled: !!(params?.supplierId && params?.from && params?.to),
    ...options,
  })
}

export function useSaleDetail(saleId, options = {}) {
  return useQuery({
    queryKey: ['sales', 'detail', saleId],
    queryFn: () => reportsApi.getSaleDetail(saleId).then((r) => r.data.data),
    enabled: !!saleId,
    ...options,
  })
}
