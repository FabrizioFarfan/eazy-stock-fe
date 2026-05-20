import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from '../services/endpoints/suppliers'

export const SUPPLIERS_KEY = 'suppliers'

export function useSuppliers(params, options = {}) {
  return useQuery({
    queryKey: [SUPPLIERS_KEY, params],
    queryFn: () => suppliersApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => suppliersApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] }),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => suppliersApi.update(id, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] }),
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => suppliersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] }),
  })
}
