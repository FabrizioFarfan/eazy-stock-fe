import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parametersApi } from '../services/endpoints/parameters'
import { PRODUCTS_KEY } from './useProducts'

/**
 * Parámetros del catálogo (Frank, 4-nov-2026). Pocos por negocio y cambian poco: se traen todos y se
 * cachean 5 min; crear/editar/apagar invalida también Productos (las fichas pintan por nombre).
 */
export const PARAMETERS_KEY = 'parameters'

export function useParameters(params = {}, options = {}) {
  return useQuery({
    queryKey: [PARAMETERS_KEY, params],
    queryFn: () => parametersApi.getAll(params).then((r) => r.data.data ?? []),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useParameterValues(id, params = {}, options = {}) {
  return useQuery({
    queryKey: [PARAMETERS_KEY, 'values', id, params],
    queryFn: () => parametersApi.values(id, params).then((r) => r.data.data ?? []),
    enabled: !!id,
    staleTime: 60 * 1000,
    ...options,
  })
}

function invalidate(qc) {
  qc.invalidateQueries({ queryKey: [PARAMETERS_KEY] })
  qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
}

export function useCreateParameter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => parametersApi.create(data).then((r) => r.data.data),
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateParameter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, params }) => parametersApi.update(id, data, params).then((r) => r.data.data),
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteParameter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }) => parametersApi.remove(id, params).then((r) => r.data.data),
    onSuccess: () => invalidate(qc),
  })
}
