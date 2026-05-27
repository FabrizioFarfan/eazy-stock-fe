import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../services/endpoints/users'

export const USERS_KEY = 'users'

export function useUsers(params = {}, options = {}) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => usersApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => usersApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => usersApi.update(id, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      qc.invalidateQueries({ queryKey: ['owners'] })
    },
  })
}

export function useToggleUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => usersApi.toggleActive(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  })
}
