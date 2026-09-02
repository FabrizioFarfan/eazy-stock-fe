import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '../services/endpoints/sales'
import { PRODUCTS_KEY } from './useProducts'

export const SALES_KEY = 'sales'

export function useSales(params) {
  return useQuery({
    queryKey: [SALES_KEY, params],
    queryFn: () => salesApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  })
}

export function useCreateSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => salesApi.create(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SALES_KEY] })
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }) // stock changed
      qc.invalidateQueries({ queryKey: ['reports'] })    // resumen del día y balances
      qc.invalidateQueries({ queryKey: ['customers'] })  // venta al fiado sube la deuda del cliente
    },
  })
}

/** Asociar/quitar el cliente de una venta pasada (William etiqueta su historial). */
export function useAssignSaleCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ saleId, customerId }) => salesApi.assignCustomer(saleId, customerId).then((r) => r.data.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [SALES_KEY] })
      qc.invalidateQueries({ queryKey: ['sales', 'detail', vars.saleId] })
      qc.invalidateQueries({ queryKey: ['customers'] })       // compras y resumen de la ficha
      qc.invalidateQueries({ queryKey: ['customer-sales'] })
      qc.invalidateQueries({ queryKey: ['reports'] })         // ranking de clientes
    },
  })
}

export function useSaleReturns(saleId, options = {}) {
  return useQuery({
    queryKey: [SALES_KEY, saleId, 'returns'],
    queryFn: () => salesApi.getReturns(saleId).then((r) => r.data.data),
    enabled: !!saleId,
    ...options,
  })
}

export function useCreateSaleReturn(saleId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => salesApi.createReturn(saleId, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SALES_KEY] })
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }) // el stock se repone
      qc.invalidateQueries({ queryKey: ['reports'] })    // balances y cuentas cambian
      qc.invalidateQueries({ queryKey: ['customers'] })  // deuda del cliente puede bajar
    },
  })
}
