import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '../services/endpoints/customers'
import { SALES_KEY } from './useSales'

export const CUSTOMERS_KEY = 'customers'
export const CUSTOMER_TXNS_KEY = 'customer-transactions'

export function useCustomers(params, options = {}) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, params],
    queryFn: () => customersApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCustomer(id, options = {}) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, 'detail', id],
    queryFn: () => customersApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
    ...options,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => customersApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data).then((r) => r.data.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY, 'detail', vars.id] })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => customersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] }),
  })
}

export function useCustomerTransactions(customerId, params, options = {}) {
  return useQuery({
    queryKey: [CUSTOMER_TXNS_KEY, customerId, params],
    queryFn: () => customersApi.getTransactions(customerId, params).then((r) => r.data.data),
    enabled: !!customerId,
    placeholderData: (prev) => prev,
    ...options,
  })
}

// Both payment and adjustment shake the same caches: customer detail (cached balance),
// the txn list, the customers index list (debt column), and the sales list (in case
// the payment shows up linked to a fiado sale).
function invalidateCustomerWrites(qc, customerId) {
  qc.invalidateQueries({ queryKey: [CUSTOMER_TXNS_KEY, customerId] })
  qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
  qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY, 'detail', customerId] })
  qc.invalidateQueries({ queryKey: [SALES_KEY] })
}

export function useRegisterCustomerPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, data }) =>
      customersApi.payment(customerId, data).then((r) => r.data.data),
    onSuccess: (_, vars) => invalidateCustomerWrites(qc, vars.customerId),
  })
}

export function useAdjustCustomerDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, data }) =>
      customersApi.adjustment(customerId, data).then((r) => r.data.data),
    onSuccess: (_, vars) => invalidateCustomerWrites(qc, vars.customerId),
  })
}
