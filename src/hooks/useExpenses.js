import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expensesApi, recurringExpensesApi } from '../services/endpoints/expenses'

/**
 * Gastos del negocio que no son mercadería (alquiler, luz, flete, sueldos…).
 * Pedido de William (10-oct-2026): «colocar los gastos de compra para calcular
 * bien cuánto se ha gastado por día, semana, mes y año». Solo dueño.
 */
export const EXPENSES_KEY = 'expenses'

export function useExpenses(params, options = {}) {
  return useQuery({
    queryKey: [EXPENSES_KEY, params],
    queryFn: () => expensesApi.list(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

function invalidate(qc) {
  qc.invalidateQueries({ queryKey: [EXPENSES_KEY] })
  qc.invalidateQueries({ queryKey: ['reports', 'purchases'] })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => expensesApi.create(data).then((r) => r.data.data),
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => expensesApi.update(id, data).then((r) => r.data.data),
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }) => expensesApi.remove(id, params).then((r) => r.data.data),
    onSuccess: () => invalidate(qc),
  })
}

// ── Gastos fijos (4-nov-2026) ──
export const RECURRING_KEY = 'recurring-expenses'

export function useRecurringExpenses(params, options = {}) {
  return useQuery({
    queryKey: [RECURRING_KEY, params],
    queryFn: () => recurringExpensesApi.list(params).then((r) => r.data.data ?? []),
    ...options,
  })
}

function invalidateRecurring(qc) {
  qc.invalidateQueries({ queryKey: [RECURRING_KEY] })
  invalidate(qc) // un fijo nuevo puede registrar el gasto de este mes al momento
}

export function useCreateRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (data) => recurringExpensesApi.create(data).then((r) => r.data.data), onSuccess: () => invalidateRecurring(qc) })
}
export function useUpdateRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, data, params }) => recurringExpensesApi.update(id, data, params).then((r) => r.data.data), onSuccess: () => invalidateRecurring(qc) })
}
export function useDeleteRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, params }) => recurringExpensesApi.remove(id, params).then((r) => r.data.data), onSuccess: () => invalidateRecurring(qc) })
}
