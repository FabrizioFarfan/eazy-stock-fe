import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { brandsApi } from '../services/endpoints/brands'

export const BRANDS_KEY = 'brands'

export function useBrands(params, options = {}) {
  return useQuery({
    queryKey: [BRANDS_KEY, params],
    queryFn: () => brandsApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => brandsApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BRANDS_KEY] }),
  })
}

export function useUpdateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => brandsApi.update(id, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BRANDS_KEY] }),
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => brandsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BRANDS_KEY] }),
  })
}
