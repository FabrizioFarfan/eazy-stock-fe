import { useQuery } from '@tanstack/react-query'
import { customersApi } from '../services/endpoints/customers'
import { supplierTransactionsApi } from '../services/endpoints/supplierTransactions'

/**
 * Cobros de fiado (clientes) y pagos a proveedores de TODO el negocio por
 * período (William, 3-oct-2026: «ingresé +400 soles de cobros de noche y al día
 * siguiente no los encontraba»). Se muestran en Stock › Movimientos y en el
 * historial de Cuentas por cobrar / por pagar.
 * params: { from?, to?, type?, page?, size?, businessId? }
 */
export const MONEY_KEY = 'money'

export function useCustomerPayments(params, options = {}) {
  return useQuery({
    queryKey: [MONEY_KEY, 'cobros', params],
    queryFn: () => customersApi.getAllTransactions(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCustomerPaymentsSummary(params, options = {}) {
  return useQuery({
    queryKey: [MONEY_KEY, 'cobros-summary', params],
    queryFn: () => customersApi.getTransactionsSummary(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useSupplierPayments(params, options = {}) {
  return useQuery({
    queryKey: [MONEY_KEY, 'pagos', params],
    queryFn: () => supplierTransactionsApi.getAllForBusiness(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useSupplierPaymentsSummary(params, options = {}) {
  return useQuery({
    queryKey: [MONEY_KEY, 'pagos-summary', params],
    queryFn: () => supplierTransactionsApi.summary(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}
