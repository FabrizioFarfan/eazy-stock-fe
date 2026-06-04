import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, Loader2, Plus, Minus, Trash2, Truck, AlertTriangle, PackagePlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useProducts } from '../../hooks/useProducts'
import { useDebounce } from '../../hooks/useDebounce'
import { useCreateSupplierReceipt } from '../../hooks/useSupplierReceipts'
import { productsApi } from '../../services/endpoints/products'
import ScannerInput from '../ScannerInput'
import PriceInput from '../inputs/PriceInput'
import { formatPrice } from '../../utils/formatMoney'
import { getErrorMessage } from '../../utils/handleApiError'

/**
 * Modal de recepción de mercadería de un proveedor.
 *
 *  - Paso 1: elegir proveedor (autocomplete)
 *  - Paso 2: cargar items en el "carrito" (búsqueda + scanner)
 *  - Paso 3: total + modo de pago (CASH | CREDIT) + factura + notas
 *
 * Single endpoint POST /api/suppliers/{id}/receipts → genera 1 receipt + N
 * stock entries + 0..1 supplier transaction.
 */
export default function SupplierReceiptModal({ onClose }) {
  const createReceipt = useCreateSupplierReceipt()

  // Supplier picker state
  const [supplier, setSupplier]               = useState(null)
  const [supplierQuery, setSupplierQuery]     = useState('')
  const [showSupplierDrop, setShowSupplierDrop] = useState(false)
  const debouncedSupplier = useDebounce(supplierQuery, 350)
  const { data: suppliersData } = useSuppliers(
    { search: debouncedSupplier || undefined, size: 8 },
    { enabled: !supplier },
  )
  const supplierResults = suppliersData?.content ?? []

  // Product picker state
  const [productQuery, setProductQuery]           = useState('')
  const [showProductDrop, setShowProductDrop]     = useState(false)
  const scanLockRef = useRef(false)
  const debouncedProduct = useDebounce(productQuery, 350)
  const { data: productsData, isLoading: loadingProducts } = useProducts(
    debouncedProduct ? { search: debouncedProduct, size: 8, active: true } : null,
    { enabled: !!debouncedProduct },
  )
  const productResults = productsData?.content ?? []

  // Cart of items
  const [items, setItems] = useState([])   // [{ product: {id, name, sku}, quantity }]
  const itemsRef = useRef([])
  // Keep ref in sync with state so the async scanCode handler reads the latest
  // cart without re-binding. Updating inside an effect (not during render).
  useEffect(() => { itemsRef.current = items }, [items])

  // Receipt header
  const [paymentMode, setPaymentMode]               = useState('CASH')
  const [totalAmount, setTotalAmount]               = useState(null)
  const [referenceDocument, setReferenceDocument]   = useState('')
  const [notes, setNotes]                           = useState('')
  const [error, setError]                           = useState(null)

  // Sugerido = sum(qty * product.purchasePrice). El owner puede sobrescribir.
  const suggestedTotal = useMemo(() => items.reduce(
    (sum, it) => sum + (Number(it.product.purchasePrice ?? 0) * it.quantity),
    0,
  ), [items])
  const showSuggestion = totalAmount == null && suggestedTotal > 0

  const addProduct = (p) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === p.id)
      if (existing) {
        return prev.map((i) => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product: p, quantity: 1 }]
    })
    setProductQuery('')
    setShowProductDrop(false)
  }
  const incQty = (id) => setItems((prev) =>
    prev.map((i) => i.product.id === id ? { ...i, quantity: i.quantity + 1 } : i))
  const decQty = (id) => setItems((prev) =>
    prev.map((i) => i.product.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.product.id !== id))

  const handleScan = async (code) => {
    if (scanLockRef.current) return
    scanLockRef.current = true
    try {
      const product = (await productsApi.scanCode(code)).data.data
      if (!product) { toast.error('Producto no encontrado'); return }
      if (itemsRef.current.some((i) => i.product.id === product.id)) {
        incQty(product.id)
        toast.info('Cantidad actualizada')
        return
      }
      addProduct(product)
      toast.success(product.name)
    } catch {
      toast.error('Producto no encontrado')
    } finally {
      scanLockRef.current = false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!supplier) { setError('Seleccioná el proveedor'); return }
    if (items.length === 0) { setError('Agregá al menos un producto'); return }
    const finalAmount = totalAmount != null ? totalAmount : suggestedTotal
    if (!finalAmount || finalAmount <= 0) {
      setError('Ingresá el monto total de la compra')
      return
    }

    try {
      await createReceipt.mutateAsync({
        supplierId: supplier.id,
        data: {
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          totalAmount: finalAmount,
          paymentMode,
          referenceDocument: referenceDocument.trim() || null,
          notes: notes.trim() || null,
        },
      })
      toast.success(
        paymentMode === 'CREDIT'
          ? `Recepción registrada — ${formatPrice(finalAmount)} sumados a la deuda con ${supplier.name}`
          : `Recepción registrada — ${formatPrice(finalAmount)} pagados al contado a ${supplier.name}`,
      )
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl max-h-[92vh]">

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <PackagePlus size={20} className="text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">Registrar recepción</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">

            {/* Supplier picker */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Proveedor <span className="text-red-500">*</span>
              </label>
              {supplier ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">{supplier.name}</span>
                    {supplier.ruc && (
                      <span className="font-mono text-xs text-blue-700">RUC {supplier.ruc}</span>
                    )}
                  </div>
                  <button type="button" onClick={() => setSupplier(null)}
                    className="rounded-lg p-1 text-blue-600 hover:bg-blue-100">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={supplierQuery}
                    onChange={(e) => { setSupplierQuery(e.target.value); setShowSupplierDrop(true) }}
                    onFocus={() => setShowSupplierDrop(true)}
                    placeholder="Buscar proveedor..."
                    className={inputCls}
                  />
                  {showSupplierDrop && (supplierResults.length > 0 || debouncedSupplier) && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-xl max-h-56 overflow-y-auto">
                      {supplierResults.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
                      ) : (
                        supplierResults.map((s) => (
                          <button key={s.id} type="button"
                            onClick={() => { setSupplier(s); setShowSupplierDrop(false); setSupplierQuery('') }}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl">
                            <div>
                              <p className="font-semibold text-gray-900">{s.name}</p>
                              {s.ruc && <p className="font-mono text-xs text-gray-400">RUC {s.ruc}</p>}
                            </div>
                            {Number(s.currentDebt ?? 0) > 0 && (
                              <span className="text-xs font-mono text-red-600">
                                Deuda: {formatPrice(s.currentDebt)}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product picker */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Productos recibidos <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ScannerInput
                  value={productQuery}
                  onChange={(v) => { setProductQuery(v); setShowProductDrop(true) }}
                  onScan={handleScan}
                  placeholder="Buscar producto o escanear..."
                />
                {showProductDrop && debouncedProduct && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-xl max-h-56 overflow-y-auto">
                    {loadingProducts ? (
                      <p className="px-4 py-3 text-sm text-gray-400">Buscando...</p>
                    ) : productResults.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
                    ) : (
                      productResults.map((p) => (
                        <button key={p.id} type="button" onClick={() => addProduct(p)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl">
                          <span className="font-semibold text-gray-900">{p.name}</span>
                          <span className="ml-2 flex-shrink-0 font-mono text-xs text-gray-400">{p.sku}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Items list */}
              {items.length === 0 ? (
                <p className="mt-2 text-xs text-gray-400">
                  Buscá productos arriba y se irán cargando acá. Podés escanear su código.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {items.map((it) => (
                    <div key={it.product.id} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{it.product.name}</p>
                        <p className="font-mono text-[10px] text-gray-400">{it.product.sku}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => decQty(it.product.id)} disabled={it.quantity === 1}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                          <Minus size={11} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900">{it.quantity}</span>
                        <button type="button" onClick={() => incQty(it.product.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                          <Plus size={11} />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeItem(it.product.id)}
                        className="flex-shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-white hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">
                    {items.length} producto{items.length !== 1 ? 's' : ''} · {totalItems} unidad{totalItems !== 1 ? 'es' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Payment mode */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Forma de pago <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPaymentMode('CASH')}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    paymentMode === 'CASH'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}>
                  Al contado
                </button>
                <button type="button" onClick={() => setPaymentMode('CREDIT')}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    paymentMode === 'CREDIT'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}>
                  A crédito (suma deuda)
                </button>
              </div>
            </div>

            {/* Total */}
            <div>
              <PriceInput
                label={<>Monto total de la compra <span className="text-red-500">*</span></>}
                value={totalAmount}
                onChange={setTotalAmount}
                maxDecimals={2}
                helperText={showSuggestion
                  ? `Sugerido por precio de compra: ${formatPrice(suggestedTotal)} — podés ajustarlo`
                  : 'Se aplica al stock y, si es a crédito, suma a la cuenta corriente'}
              />
            </div>

            {/* Reference document */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Referencia (factura / guía) {paymentMode === 'CREDIT' && <span className="text-gray-400">(recomendado)</span>}
              </label>
              <input
                value={referenceDocument}
                onChange={(e) => setReferenceDocument(e.target.value)}
                maxLength={100}
                placeholder="Factura 0023-001234"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Preview block */}
            {supplier && items.length > 0 && totalAmount != null && totalAmount > 0 && (
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm ring-1 ring-gray-100">
                <p className="font-semibold text-gray-800">Resumen</p>
                <p className="mt-1 text-gray-600">
                  Vas a registrar {items.length} producto{items.length !== 1 ? 's' : ''} ({totalItems} unidades)
                  recibidos de <span className="font-semibold">{supplier.name}</span> por{' '}
                  <span className="font-mono font-semibold">{formatPrice(totalAmount)}</span>{' '}
                  {paymentMode === 'CREDIT'
                    ? <>al <span className="font-semibold text-amber-700">crédito</span>. Se sumará a tu deuda con el proveedor.</>
                    : <>al <span className="font-semibold text-emerald-700">contado</span>. No genera cuenta por pagar.</>}
                </p>
              </div>
            )}

            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />{error}
              </p>
            )}
          </div>

          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" disabled={createReceipt.isPending}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 disabled:opacity-60">
              {createReceipt.isPending && <Loader2 size={14} className="animate-spin" />}
              {createReceipt.isPending ? 'Registrando...' : 'Registrar recepción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
