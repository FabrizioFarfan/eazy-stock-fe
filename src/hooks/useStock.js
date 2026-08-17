import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockApi } from '../services/endpoints/stock'

export const MOVEMENTS_KEY = 'movements'

export function useMovements(params, options = {}) {
  return useQuery({
    queryKey: [MOVEMENTS_KEY, params],
    queryFn: () => stockApi.getMovements(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

// Clave anidada bajo MOVEMENTS_KEY: toda invalidación de movimientos
// (ventas, recepciones, ajustes) refresca también el resumen.
export function useSalesSummary(params, options = {}) {
  return useQuery({
    queryKey: [MOVEMENTS_KEY, 'sales-summary', params],
    queryFn: () => stockApi.getSalesSummary(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCreateMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => stockApi.createMovement(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MOVEMENTS_KEY] })
      qc.invalidateQueries({ queryKey: ['products'] }) // stock levels changed
    },
  })
}
