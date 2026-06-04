import { useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from '../services/endpoints/suppliers'
import { SUPPLIERS_KEY } from './useSuppliers'
import { SUPPLIER_TXNS_KEY } from './useSupplierTransactions'
import { PRODUCTS_KEY } from './useProducts'

export function useCreateSupplierReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, data }) =>
      suppliersApi.createReceipt(supplierId, data).then((r) => r.data.data),
    onSuccess: (_, vars) => {
      // Stock cambió, deuda con el proveedor también, listings de proveedor también.
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] })
      qc.invalidateQueries({ queryKey: [SUPPLIER_TXNS_KEY, vars.supplierId] })
      qc.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}
