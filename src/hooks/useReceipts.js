import { useQuery } from '@tanstack/react-query'
import { receiptsApi } from '../services/endpoints/receipts'

export const RECEIPTS_KEY = 'receipts'

export function useReceipts(params, options = {}) {
  return useQuery({
    queryKey: [RECEIPTS_KEY, params],
    queryFn: () => receiptsApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useReceiptDetail(id, options = {}) {
  return useQuery({
    queryKey: [RECEIPTS_KEY, 'detail', id],
    queryFn: () => receiptsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
    ...options,
  })
}
