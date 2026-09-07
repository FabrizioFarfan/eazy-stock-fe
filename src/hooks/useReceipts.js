import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { receiptsApi } from '../services/endpoints/receipts'
import { useDebounce } from './useDebounce'
import { SUPPLIERS_KEY } from './useSuppliers'
import { SUPPLIER_TXNS_KEY } from './useSupplierTransactions'
import { PRODUCTS_KEY } from './useProducts'
import { MOVEMENTS_KEY } from './useStock'

export const RECEIPTS_KEY = 'receipts'

export function useReceipts(params, options = {}) {
  return useQuery({
    queryKey: [RECEIPTS_KEY, params],
    queryFn: () => receiptsApi.getAll(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useReceiptDetail(id, options = {}) {
  return useQuery({
    queryKey: [RECEIPTS_KEY, 'detail', id],
    queryFn: () => receiptsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
    ...options,
  })
}

/**
 * Chequeo en vivo «¿esta factura / guía ya existe?» mientras el usuario tipea
 * (pedido de William: dos recepciones quedaron con la misma factura).
 * Devuelve { exists, sameSupplier, supplierName, amount, createdAt, ... } o null
 * si todavía no hay nada que chequear. `excludeId` para editar una recepción.
 */
export function useReferenceCheck(supplierId, reference, excludeId = null) {
  const debounced = useDebounce((reference ?? '').trim(), 400)
  const enabled = !!supplierId && debounced.length >= 2
  const query = useQuery({
    queryKey: [RECEIPTS_KEY, 'check-reference', supplierId, debounced, excludeId],
    queryFn: () => receiptsApi
      .checkReference({ supplierId, reference: debounced, ...(excludeId && { excludeId }) })
      .then((r) => r.data.data),
    enabled,
    staleTime: 10_000,
  })
  // Mientras el debounce no alcanzó lo tipeado, el resultado viejo no vale.
  const current = (reference ?? '').trim() === debounced
  return {
    result: enabled && current ? (query.data ?? null) : null,
    checking: enabled && (!current || query.isFetching),
  }
}

function invalidateAfterReceiptChange(qc, supplierId) {
  qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
  qc.invalidateQueries({ queryKey: [MOVEMENTS_KEY] })
  qc.invalidateQueries({ queryKey: [RECEIPTS_KEY] })
  qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] })
  if (supplierId) qc.invalidateQueries({ queryKey: [SUPPLIER_TXNS_KEY, supplierId] })
  qc.invalidateQueries({ queryKey: ['reports'] })
}

export function useAnnulReceiptPreview(id, options = {}) {
  return useQuery({
    queryKey: [RECEIPTS_KEY, 'annul-preview', id],
    queryFn: () => receiptsApi.annulPreview(id).then((r) => r.data.data),
    enabled: !!id,
    ...options,
  })
}

/** Anular (borrar) la recepción: revierte stock y deuda. Solo OWNER. */
export function useAnnulReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }) => receiptsApi.annul(id).then((r) => r.data.data),
    onSuccess: (_, vars) => invalidateAfterReceiptChange(qc, vars.supplierId),
  })
}

/** Corregir el número de factura / guía de una recepción ya registrada. */
export function useUpdateReceiptReference() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, referenceDocument }) =>
      receiptsApi.updateReference(id, referenceDocument).then((r) => r.data.data),
    onSuccess: (_, vars) => invalidateAfterReceiptChange(qc, vars.supplierId),
  })
}
