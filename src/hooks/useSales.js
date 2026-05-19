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
    },
  })
}
