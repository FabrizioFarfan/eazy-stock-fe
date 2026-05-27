import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '../services/endpoints/categories'

const KEY = 'categories'

export function useCategories(params, options = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => categoriesApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useSuggestedAttributes(categoryId, options = {}) {
  return useQuery({
    queryKey: [KEY, 'suggested', categoryId],
    queryFn: () => categoriesApi.getSuggestedAttributes(categoryId).then((r) => r.data.data),
    enabled: !!categoryId,
    ...options,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => categoriesApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => categoriesApi.update(id, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => categoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}
