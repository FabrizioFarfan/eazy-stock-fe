import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from '../services/endpoints/suppliers'
import { PRODUCTS_KEY } from './useProducts'

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
    mutationFn: ({ id, data, params }) => suppliersApi.update(id, data, params).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] })
      // El rename debe verse en las filas de Productos (supplierName cacheado ahí).
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    // acepta un id pelado o { id, params } (SUPER_ADMIN pasa businessId)
    mutationFn: (vars) => (typeof vars === 'object' ? suppliersApi.remove(vars.id, vars.params) : suppliersApi.remove(vars)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] })
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}
