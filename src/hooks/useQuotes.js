import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { quotesApi } from '../services/endpoints/quotes'
import { useInfiniteSearch } from './useInfiniteSearch'

export const QUOTES_KEY = 'quotes'

/** Historial de cotizaciones con scroll infinito (búsqueda por cliente, teléfono, número o producto). */
export function useQuoteSearch(search, extra = {}) {
  return useInfiniteSearch([QUOTES_KEY], quotesApi.getAll, { search: search || undefined, ...extra }, { pageSize: 20 })
}

export function useQuote(id, options = {}) {
  return useQuery({
    queryKey: [QUOTES_KEY, id],
    queryFn: () => quotesApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
    ...options,
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => quotesApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUOTES_KEY] }),
  })
}

export function useDeleteQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => quotesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUOTES_KEY] }),
  })
}
