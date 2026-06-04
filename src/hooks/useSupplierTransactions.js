import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supplierTransactionsApi } from '../services/endpoints/supplierTransactions'
import { SUPPLIERS_KEY } from './useSuppliers'

export const SUPPLIER_TXNS_KEY = 'supplier-transactions'

export function useSupplierTransactions(supplierId, params, options = {}) {
  return useQuery({
    queryKey: [SUPPLIER_TXNS_KEY, supplierId, params],
    queryFn: () => supplierTransactionsApi.getAll(supplierId, params).then((r) => r.data.data),
    enabled: !!supplierId,
    placeholderData: (prev) => prev,
    ...options,
  })
}

function invalidate(qc, supplierId) {
  qc.invalidateQueries({ queryKey: [SUPPLIER_TXNS_KEY, supplierId] })
  qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] })
}

export function useAddSupplierDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, data }) =>
      supplierTransactionsApi.addDebt(supplierId, data).then((r) => r.data.data),
    onSuccess: (_, vars) => invalidate(qc, vars.supplierId),
  })
}

export function useRegisterSupplierPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, data }) =>
      supplierTransactionsApi.payment(supplierId, data).then((r) => r.data.data),
    onSuccess: (_, vars) => invalidate(qc, vars.supplierId),
  })
}

export function useAdjustSupplierDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, data }) =>
      supplierTransactionsApi.adjustment(supplierId, data).then((r) => r.data.data),
    onSuccess: (_, vars) => invalidate(qc, vars.supplierId),
  })
}
