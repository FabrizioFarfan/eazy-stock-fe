import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../services/endpoints/subscription'
import { bossApi } from '../services/endpoints/boss'
import { useAuth } from '../context/AuthContext'

export const SUBSCRIPTION_KEY = 'my-subscription'
export const PLANS_KEY = 'plans'
export const BOSS_SUBSCRIPTIONS_KEY = 'boss-subscriptions'

const unwrap = (r) => r.data?.data ?? r.data

/** La suscripción del negocio del usuario logueado (OWNER y EMPLOYEE). */
export function useSubscription(options = {}) {
  const { user } = useAuth()
  const enabled = !!user && (user.role === 'OWNER' || user.role === 'EMPLOYEE')
  return useQuery({
    queryKey: [SUBSCRIPTION_KEY, user?.businessId],
    queryFn: () => subscriptionApi.getMine().then(unwrap),
    staleTime: 5 * 60 * 1000,
    enabled,
    ...options,
  })
}

/** Catálogo público de planes del BE (precios, límites, prueba, descuento de lanzamiento). */
export function usePlans(options = {}) {
  return useQuery({
    queryKey: [PLANS_KEY],
    queryFn: () => subscriptionApi.getPlans().then(unwrap),
    staleTime: 60 * 60 * 1000,
    ...options,
  })
}

// ── Boss ─────────────────────────────────────────────────────────────────────

export function useBossSubscriptions(options = {}) {
  return useQuery({
    queryKey: [BOSS_SUBSCRIPTIONS_KEY],
    queryFn: () => bossApi.getSubscriptions().then(unwrap),
    ...options,
  })
}

function useBossMutation(fn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BOSS_SUBSCRIPTIONS_KEY] })
      qc.invalidateQueries({ queryKey: ['boss-activity'] })
    },
  })
}

export function useUpdateSubscription() {
  return useBossMutation(({ businessId, data }) => bossApi.updateSubscription(businessId, data).then(unwrap))
}
export function useMarkPaid() {
  return useBossMutation(({ businessId, months }) => bossApi.markPaid(businessId, months).then(unwrap))
}
export function useExtendTrial() {
  return useBossMutation(({ businessId, days }) => bossApi.extendTrial(businessId, days).then(unwrap))
}
