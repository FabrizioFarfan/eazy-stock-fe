import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentMethodsApi } from '../services/endpoints/paymentMethods'

export const PAYMENT_METHODS_KEY = 'payment-methods'

const unwrap = (r) => r.data?.data ?? r.data

/**
 * Medios de pago del negocio, en el orden del dueño. Por defecto solo los
 * activos (lo que se ve al cobrar); `includeInactive` para Ajustes y filtros.
 */
export function usePaymentMethods({ includeInactive = false, enabled = true } = {}) {
  return useQuery({
    queryKey: [PAYMENT_METHODS_KEY, { includeInactive }],
    queryFn: () => paymentMethodsApi.list({ includeInactive }).then(unwrap),
    staleTime: 60_000,
    enabled,
  })
}

function useInvalidating(mutationFn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: [PAYMENT_METHODS_KEY] }),
  })
}

export const useCreatePaymentMethod  = () => useInvalidating((data) => paymentMethodsApi.create(data).then(unwrap))
export const useUpdatePaymentMethod  = () => useInvalidating(({ id, data }) => paymentMethodsApi.update(id, data).then(unwrap))
export const useReorderPaymentMethods = () => useInvalidating((ids) => paymentMethodsApi.reorder(ids).then(unwrap))
export const useDeletePaymentMethod  = () => useInvalidating((id) => paymentMethodsApi.remove(id))
