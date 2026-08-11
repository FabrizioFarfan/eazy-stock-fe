import { useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from '../services/endpoints/suppliers'
import { SUPPLIERS_KEY } from './useSuppliers'
import { SUPPLIER_TXNS_KEY } from './useSupplierTransactions'
import { PRODUCTS_KEY } from './useProducts'
import { MOVEMENTS_KEY } from './useStock'
import { RECEIPTS_KEY } from './useReceipts'

export function useCreateSupplierReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, data }) =>
      suppliersApi.createReceipt(supplierId, data).then((r) => r.data.data),
    onSuccess: (_, vars) => {
      // Stock y precio de compra cambiaron, deuda con el proveedor también,
      // listings de proveedor también. OJO: usar SIEMPRE las *_KEY exportadas —
      // acá vivieron claves inventadas ('stock-movements', 'stock') que no
      // invalidaban nada y dejaban Movimientos/Recepciones viejos 30s.
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      qc.invalidateQueries({ queryKey: [MOVEMENTS_KEY] })
      qc.invalidateQueries({ queryKey: [RECEIPTS_KEY] })
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] })
      qc.invalidateQueries({ queryKey: [SUPPLIER_TXNS_KEY, vars.supplierId] })
      qc.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}
