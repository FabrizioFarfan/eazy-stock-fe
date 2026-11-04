import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ownersApi } from '../services/endpoints/owners'

export const OWNERS_KEY = 'owners'

export function useOwners(params = {}, options = {}) {
  return useQuery({
    queryKey: [OWNERS_KEY, params],
    queryFn: () => ownersApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCreateOwner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => ownersApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [OWNERS_KEY] }),
  })
}

export function useDeleteOwner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, confirmEmail, withData }) => ownersApi.remove(id, confirmEmail, withData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [OWNERS_KEY] })
      qc.invalidateQueries({ queryKey: ['boss-activity'] })
      qc.invalidateQueries({ queryKey: ['boss-team'] })
      qc.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}
