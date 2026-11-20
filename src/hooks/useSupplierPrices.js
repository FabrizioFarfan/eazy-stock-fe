import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '../services/endpoints/products'
import { offersByProduct } from '../utils/supplierCompare'

/**
 * A quién se le compró cada producto y a cuánto la última vez (William, 20-nov-2026).
 * Devuelve { byProduct: { [productId]: offers[] }, isLoading }. El vendedor que no ve costos recibe todo vacío.
 */
export function useSupplierPrices(productIds, businessId, options = {}) {
  const ids = useMemo(() => [...new Set((productIds ?? []).filter(Boolean))].sort(), [productIds])
  const query = useQuery({
    queryKey: ['supplier-prices', businessId ?? null, ids],
    queryFn: () => productsApi.supplierPrices({ productIds: ids.slice(0, 500), ...(businessId && { businessId }) }).then((r) => r.data.data),
    enabled: ids.length > 0 && (options.enabled ?? true),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
  const byProduct = useMemo(() => offersByProduct(query.data), [query.data])
  return { byProduct, isLoading: query.isLoading }
}
