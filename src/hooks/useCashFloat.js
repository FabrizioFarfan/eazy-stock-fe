import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashFloatApi } from '../services/endpoints/cashFloat'

export const CASH_FLOAT_KEY = 'cash-float'

export function useCashFloatDay(params = {}, options = {}) {
  return useQuery({
    queryKey: [CASH_FLOAT_KEY, params],
    queryFn: () => cashFloatApi.getDay(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

function invalidate(qc) {
  qc.invalidateQueries({ queryKey: [CASH_FLOAT_KEY] })
  // el cierre de caja suma el fondo: que se refresque solo
  qc.invalidateQueries({ queryKey: ['reports', 'cash-closing'] })
}

export function useRegisterCashFloat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => cashFloatApi.register(data).then((r) => r.data.data),
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteCashFloat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }) => cashFloatApi.remove(id, params).then((r) => r.data.data),
    onSuccess: () => invalidate(qc),
  })
}
