import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../services/endpoints/products'

export const PRODUCTS_KEY = 'products'

/** Paginated product list with optional filters. */
export function useProducts(params, options = {}) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => productsApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => productsApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}

export function useDeactivateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => productsApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}

/** Devuelve al catálogo un producto oculto (con su mismo código). */
export function useReactivateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => productsApi.reactivate(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}

/**
 * Borrado definitivo de un producto sin uso. Libera su código para que el
 * protocolo del negocio no salte números por productos que nunca se vendieron.
 */
export function useDeleteProductPermanently() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => productsApi.deletePermanently(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}

/** Borrado masivo por rango de fecha de creación. */
export function useBulkDeleteProducts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ from, to }) => productsApi.bulkDelete(from, to).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}
