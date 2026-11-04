import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { productsApi } from '../../services/endpoints/products'
import { useAuth } from '../../context/AuthContext'
import { useReactivateProduct, PRODUCTS_KEY } from '../../hooks/useProducts'
import { getErrorMessage } from '../../utils/handleApiError'
import ProductDetailModal from './ProductDetailModal'
import ProductFormModal from './ProductFormModal'
import QrModal from './QrModal'
import DeleteProductModal from './DeleteProductModal'
import MovementModal from '../../pages/stock/MovementModal'
import SupplierReceiptModal from '../stock/SupplierReceiptModal'
import { useT } from '../../i18n'

/**
 * LA FICHA ÚNICA del producto (William, 4-nov-2026): «si entro a Productos veo los datos pero no puedo tocar el
 * stock, y si entro a Stock veo la cantidad pero no la info del producto; quiero entrar a una sola pantalla y
 * hacer todo ahí». Productos y Stock › Inventario abren ESTE componente: la ficha completa con sus datos y
 * precios, el stock, Ajustar stock, Registrar entrada, el historial de movimientos y recepciones, Editar,
 * QR, ocultar/borrar y reactivar. Cada acción se abre encima y, al cerrarla, la ficha se refresca sola; nada
 * te saca de la pantalla. Permisos de siempre: el vendedor no ajusta stock ni ve costos; edita solo con
 * «Gestionar productos»; anota lo que llega (entrada simple) solo con «Recibir mercadería».
 */
export default function ProductSheet({ product: initial, onClose, onChanged }) {
  const t = useT()
  const { user, can } = useAuth()
  const qc = useQueryClient()
  const isManager = user?.role === 'OWNER' || (user?.role === 'SUPER_ADMIN' && !!user?.businessId)
  const isEmployee = user?.role === 'EMPLOYEE'
  const canManage = isManager || can('canManageProducts')
  const canAdjust = isManager || (isEmployee && can('canModifyStockManually'))
  const canReceiveFull = isManager
  const canNoteArrival = isEmployee && can('canReceiveMerchandise')

  // La ficha se refresca sola tras cada acción (ajuste, entrada, edición, fusión).
  const { data: fresh } = useQuery({
    queryKey: [PRODUCTS_KEY, 'sheet', initial?.id],
    queryFn: () => productsApi.getById(initial.id).then((r) => r.data.data),
    enabled: !!initial?.id,
    initialData: initial,
    staleTime: 0,
  })
  const product = fresh ?? initial
  const refresh = () => {
    qc.invalidateQueries({ queryKey: [PRODUCTS_KEY, 'sheet', initial?.id] })
    qc.invalidateQueries({ queryKey: ['stock-movements', 'product', initial?.id] })
    qc.invalidateQueries({ queryKey: ['receipts'] })
    onChanged?.()
  }

  const [sub, setSub] = useState(null) // null | 'edit' | 'qr' | 'delete' | 'adjust' | 'entry' | 'simple'
  const closeSub = () => { setSub(null); refresh() }
  const reactivate = useReactivateProduct()

  // Si el producto se borró de verdad (DeleteProductModal.onDone) la ficha se cierra.
  const [gone, setGone] = useState(false)
  useEffect(() => { if (gone) onClose() }, [gone, onClose])

  const handleReactivate = async (p) => {
    try {
      await reactivate.mutateAsync(p.id)
      toast.success(t('"{name}" volvió al catálogo con su código {sku}.', { name: p.name, sku: p.sku }))
      refresh()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  if (!product) return null
  return (
    <>
      <ProductDetailModal
        product={product}
        onClose={onClose}
        onEdit={canManage ? () => setSub('edit') : undefined}
        onShowQr={canManage ? () => setSub('qr') : undefined}
        onDeactivate={isManager ? () => setSub('delete') : undefined}
        onReactivate={isManager ? handleReactivate : undefined}
        onAdjust={canAdjust ? () => setSub('adjust') : undefined}
        onRegisterEntry={canReceiveFull ? () => setSub('entry') : canNoteArrival ? () => setSub('simple') : undefined}
        onMerged={isManager ? () => refresh() : undefined}
      />
      {sub === 'edit' && (
        <ProductFormModal product={product} onClose={closeSub}
          onEditExisting={(p) => { qc.setQueryData([PRODUCTS_KEY, 'sheet', initial?.id], p) }} />
      )}
      {sub === 'qr' && <QrModal product={product} onClose={() => setSub(null)} />}
      {sub === 'delete' && (
        <DeleteProductModal product={product} onClose={closeSub} onDone={() => { setSub(null); setGone(true); onChanged?.() }} />
      )}
      {sub === 'adjust' && <MovementModal type="ADJUSTMENT" initialProduct={product} onClose={closeSub} />}
      {sub === 'entry' && (
        <SupplierReceiptModal
          initialSupplier={product.supplierId ? { id: product.supplierId, name: product.supplierName } : null}
          initialProduct={product.supplierId ? product : null}
          onClose={closeSub} />
      )}
      {sub === 'simple' && (
        <SupplierReceiptModal simple
          initialSupplier={product.supplierId ? { id: product.supplierId, name: product.supplierName } : null}
          initialProduct={product.supplierId ? product : null}
          onClose={closeSub} />
      )}
    </>
  )
}
