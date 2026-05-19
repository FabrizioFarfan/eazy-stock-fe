import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessesApi } from '../services/endpoints/businesses'

export const BUSINESSES_KEY = 'businesses'

export function useBusinesses(params, options = {}) {
  return useQuery({
    queryKey: [BUSINESSES_KEY, params],
    queryFn: () => businessesApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCreateBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => businessesApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BUSINESSES_KEY] }),
  })
}

export function useUpdateBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => businessesApi.update(id, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BUSINESSES_KEY] }),
  })
}

export function useDeleteBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => businessesApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BUSINESSES_KEY] }),
  })
}
