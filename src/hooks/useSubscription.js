import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../services/endpoints/subscription'
import { bossApi } from '../services/endpoints/boss'
import { useAuth } from '../context/AuthContext'

export const SUBSCRIPTION_KEY = 'my-subscription'
export const PLANS_KEY = 'plans'
export const BOSS_SUBSCRIPTIONS_KEY = 'boss-subscriptions'

const unwrap = (r) => r.data?.data ?? r.data

/** La suscripción de la cuenta del dueño (la ve el OWNER y, para el banner de solo lectura, el EMPLOYEE). */
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

/** Catálogo público de planes del BE (precios, límites, prueba). Sus campos del descuento de lanzamiento ya no se usan. */
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
  return useBossMutation(({ ownerId, data }) => bossApi.updateSubscription(ownerId, data).then(unwrap))
}
export function useMarkPaid() {
  return useBossMutation(({ ownerId, months }) => bossApi.markPaid(ownerId, months).then(unwrap))
}
export function useExtendTrial() {
  return useBossMutation(({ ownerId, days }) => bossApi.extendTrial(ownerId, days).then(unwrap))
}
export function useSetCoupon() {
  return useBossMutation(({ ownerId, couponId }) => bossApi.setCoupon(ownerId, couponId).then(unwrap))
}
