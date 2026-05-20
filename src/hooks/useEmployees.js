import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '../services/endpoints/employees'

export const EMPLOYEES_KEY = 'employees'

export function useEmployees(params = {}, options = {}) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, params],
    queryFn: () => employeesApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => employeesApi.create(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EMPLOYEES_KEY] }),
  })
}

export function useToggleEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => employeesApi.toggleActive(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EMPLOYEES_KEY] }),
  })
}
