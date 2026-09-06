import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationsApi } from '../services/endpoints/locations'
import { PRODUCTS_KEY } from './useProducts'

export const LOCATIONS_KEY = 'locations'

export function useLocations(params, options = {}) {
  return useQuery({
    queryKey: [LOCATIONS_KEY, params],
    queryFn: () => locationsApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => locationsApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LOCATIONS_KEY] }),
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, params }) => locationsApi.update(id, data, params).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LOCATIONS_KEY] })
      // El rename debe verse en las filas de Productos (locationName cacheado ahí).
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars) => (typeof vars === 'object' ? locationsApi.remove(vars.id, vars.params) : locationsApi.remove(vars)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LOCATIONS_KEY] })
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}
