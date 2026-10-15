import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { myBusinessesApi } from '../services/endpoints/myBusinesses'
import { useAuth } from '../context/AuthContext'
import { SUBSCRIPTION_KEY } from './useSubscription'

export const MY_BUSINESSES_KEY = 'my-businesses'
export const BUSINESSES_OVERVIEW_KEY = 'my-businesses-overview'

const unwrap = (r) => r.data?.data ?? r.data

/** Los negocios de la cuenta del dueño (solo OWNER). */
export function useMyBusinesses(options = {}) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [MY_BUSINESSES_KEY, user?.id],
    queryFn: () => myBusinessesApi.list().then(unwrap),
    staleTime: 2 * 60 * 1000,
    enabled: !!user && user.role === 'OWNER',
    ...options,
  })
}

/** Números de cada negocio + suma total por moneda en el período. */
export function useBusinessesOverview(range, options = {}) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [BUSINESSES_OVERVIEW_KEY, user?.id, range?.from, range?.to],
    queryFn: () => myBusinessesApi.overview({ from: range.from, to: range.to }).then(unwrap),
    enabled: !!user && user.role === 'OWNER' && !!range?.from && !!range?.to,
    ...options,
  })
}

export function useCreateBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => myBusinessesApi.create(data).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MY_BUSINESSES_KEY] })
      qc.invalidateQueries({ queryKey: [BUSINESSES_OVERVIEW_KEY] })
      qc.invalidateQueries({ queryKey: [SUBSCRIPTION_KEY] })
    },
  })
}
