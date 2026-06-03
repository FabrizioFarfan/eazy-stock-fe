import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, X, ShoppingCart, Loader2, Check, ArrowLeft, Search, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../hooks/useProducts'
import { useCreateSale } from '../hooks/useSales'
import { useDebounce } from '../hooks/useDebounce'
import { productsApi } from '../services/endpoints/products'
import ScannerInput from '../components/ScannerInput'

function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

// Parse a user-entered numeric string into a number, treating empty/invalid as 0.
function parseNumber(s) {
  if (s == null || s === '') return 0
  const n = parseFloat(String(s).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

// ── ProductCard ───────────────────────────────────────────────────────────────

function ProductCard({ product, inCart, onAdd }) {
  const noStock = product.currentStock === 0

  return (
    <div className={`rounded-2xl border bg-white p-3.5 transition-all ${
      inCart
        ? 'border-blue-200 shadow-sm shadow-blue-100/80'
        : 'border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">
              {product.sku}
            </span>
            {(product.brandName || product.supplierName) && (
              <span className="truncate text-xs text-gray-400">
                {[product.brandName, product.supplierName].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400">
            Stock:{' '}
            <span className={`font-bold ${noStock ? 'text-red-500' : 'text-gray-700'}`}>
              {product.currentStock} uds.
            </span>
          </p>
          <p className="text-base font-bold text-gray-900">{formatCurrency(product.salePrice)}</p>
        </div>

        {inCart ? (
          <button disabled className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <Check size={12} />En carrito
          </button>
        ) : noStock ? (
          <button disabled className="cursor-not-allowed rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400">
            Sin stock
          </button>
        ) : (
          <button onClick={() => onAdd(product)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.95]">
            <Plus size={12} />Agregar
          </button>
        )}
      </div>
    </div>
  )
}

// ── CartItem ──────────────────────────────────────────────────────────────────

function CartItem({ item, canApplyDiscount, onIncrease, onDecrease, onRemove, onPriceChange }) {
  const { product, quantity, unitPrice } = item
  const numericPrice = parseNumber(unitPrice)
  const subtotal     = quantity * numericPrice
  const isModified   = Math.abs(numericPrice - Number(product.salePrice ?? 0)) > 0.0001

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 text-sm font-semibold leading-snug text-gray-900">{product.name}</p>
        <button onClick={() => onRemove(product.id)}
          className="flex-shrink-0 rounded-lg p-0.5 text-gray-300 transition-colors hover:bg-white hover:text-gray-500">
          <X size={13} />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button onClick={() => onDecrease(product.id)} disabled={quantity === 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40">
            <Minus size={11} />
          </button>
          <span className="w-7 text-center text-sm font-bold text-gray-900">{quantity}</span>
          <button onClick={() => onIncrease(product.id)} disabled={quantity >= product.currentStock}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40">
            <Plus size={11} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">S/</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={unitPrice}
            disabled={!canApplyDiscount}
            title={canApplyDiscount ? 'Editar precio de esta línea' : 'Tu administrador no te ha autorizado a modificar precios'}
            onChange={(e) => onPriceChange(product.id, e.target.value)}
            className={`w-20 rounded-lg border px-2 py-1 text-right text-sm font-semibold outline-none transition-colors ${
              isModified
                ? 'border-orange-300 bg-orange-50 text-orange-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                : 'border-gray-200 bg-white text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
            } ${!canApplyDiscount ? 'cursor-not-allowed opacity-70' : ''}`}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {isModified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
            <Tag size={10} />Precio modificado
          </span>
        ) : (
          <span /> /* spacer */
        )}
        <p className="text-sm font-bold text-gray-900">{formatCurrency(subtotal)}</p>
      </div>
    </div>
  )
}

// ── DiscountSection ───────────────────────────────────────────────────────────

function DiscountSection({ subtotal, discountType, setDiscountType, discountValue, setDiscountValue }) {
  const numericValue   = parseNumber(discountValue)
  const discountAmount = discountType === 'PERCENTAGE'
    ? Math.min(subtotal, subtotal * Math.min(numericValue, 100) / 100)
    : Math.min(subtotal, numericValue)

  const safeAmount = Number.isFinite(discountAmount) && discountAmount > 0 ? discountAmount : 0

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-gray-900">Descuento total</h3>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDiscountType('PERCENTAGE')}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
            discountType === 'PERCENTAGE'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          % Porcentaje
        </button>
        <button
          type="button"
          onClick={() => setDiscountType('FIXED_AMOUNT')}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
            discountType === 'FIXED_AMOUNT'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Monto fijo
        </button>
      </div>

      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          max={discountType === 'PERCENTAGE' ? 100 : subtotal || undefined}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          placeholder={discountType === 'PERCENTAGE' ? '0' : '0.00'}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
          {discountType === 'PERCENTAGE' ? '%' : 'S/'}
        </span>
      </div>

      {safeAmount > 0 && (
        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-orange-600">
            <span>
              Descuento{discountType === 'PERCENTAGE' ? ` (${numericValue}%)` : ''}
            </span>
            <span>−{formatCurrency(safeAmount)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewSalePage() {
  const navigate      = useNavigate()
  const { can }       = useAuth()
  const canApplyDiscount = can('canApplyDiscount')

  const createSale    = useCreateSale()
  const cartRef       = useRef(null)
  const scanLockRef   = useRef(false)
  const cartStateRef  = useRef([])

  const [search, setSearch]               = useState('')
  const debouncedSearch                   = useDebounce(search, 400)
  const [cart, setCart]                   = useState([])
  const [notes, setNotes]                 = useState('')
  const [discountType, setDiscountType]   = useState('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')

  useEffect(() => { cartStateRef.current = cart }, [cart])

  const { data: productsData, isLoading: loadingProducts } = useProducts(
    debouncedSearch ? { search: debouncedSearch, size: 10, active: true } : null,
    { enabled: !!debouncedSearch },
  )
  const searchResults = productsData?.content ?? []
  const cartIds       = new Set(cart.map((i) => i.product.id))

  const addToCart = (product) => {
    setCart((prev) => [
      ...prev,
      { product, quantity: 1, unitPrice: String(product.salePrice ?? 0) },
    ])
  }
  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.product.id !== id))
  const increase = (id) => setCart((prev) =>
    prev.map((i) => i.product.id === id
      ? { ...i, quantity: Math.min(i.quantity + 1, i.product.currentStock) } : i))
  const decrease = (id) => setCart((prev) =>
    prev.map((i) => i.product.id === id
      ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))
  const changePrice = (id, raw) => setCart((prev) =>
    prev.map((i) => i.product.id === id ? { ...i, unitPrice: raw } : i))

  const scanCode = async (code) => {
    if (scanLockRef.current) return
    scanLockRef.current = true
    try {
      const product = (await productsApi.scanCode(code)).data.data
      if (!product)                   { toast.error('Producto no encontrado'); return }
      if (product.currentStock === 0) { toast.warning('Sin stock disponible'); return }
      if (cartStateRef.current.some((i) => i.product.id === product.id)) {
        increase(product.id)
        toast.info('Cantidad actualizada')
        return
      }
      addToCart(product)
      toast.success(product.name)
    } catch {
      toast.error('Producto no encontrado')
    } finally {
      scanLockRef.current = false
    }
  }

  // ── live totals ───────────────────────────────────────────────────────────
  const subtotal = cart.reduce(
    (sum, i) => sum + i.quantity * parseNumber(i.unitPrice),
    0,
  )
  const numericDiscount = canApplyDiscount ? parseNumber(discountValue) : 0
  const discountAmount  = !canApplyDiscount || numericDiscount <= 0
    ? 0
    : discountType === 'PERCENTAGE'
      ? Math.min(subtotal, subtotal * Math.min(numericDiscount, 100) / 100)
      : Math.min(subtotal, numericDiscount)
  const total = Math.max(0, subtotal - discountAmount)

  const handleSubmit = async () => {
    if (cart.length === 0) return
    try {
      const items = cart.map((i) => {
        const enteredPrice = parseNumber(i.unitPrice)
        const original     = Number(i.product.salePrice ?? 0)
        const overrideUsed = canApplyDiscount && Math.abs(enteredPrice - original) > 0.0001
        return {
          productId: i.product.id,
          quantity: i.quantity,
          ...(overrideUsed && { unitPriceOverride: enteredPrice }),
        }
      })

      const includeTotalDiscount = canApplyDiscount && numericDiscount > 0
      await createSale.mutateAsync({
        items,
        ...(notes.trim() && { notes: notes.trim() }),
        ...(includeTotalDiscount && {
          discountType,
          discountValue: numericDiscount,
        }),
      })
      navigate('/sales')
    } catch { /* error shown via createSale.isError */ }
  }

  return (
    <div className="flex flex-col gap-4 pb-24">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sales')}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Volver</span>
        </button>
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Nueva venta</h2>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

        <div className="flex flex-col gap-3 lg:min-w-0 lg:flex-1">
          <ScannerInput
            value={search}
            onChange={setSearch}
            onScan={scanCode}
            placeholder="Buscar por nombre, código o escanear..."
          />

          {!debouncedSearch ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <Search size={28} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">Busca un producto o escanea su código</p>
              <p className="text-xs text-gray-400">Escribe el nombre, código o usa el lector de códigos</p>
            </div>
          ) : loadingProducts ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <p className="text-sm font-medium text-gray-500">Sin resultados</p>
              <p className="text-xs text-gray-400">No se encontraron productos para "{debouncedSearch}"</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {searchResults.map((p) => (
                <ProductCard key={p.id} product={p} inCart={cartIds.has(p.id)} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>

        <div ref={cartRef} className="flex flex-col gap-3 lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-4">

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Carrito</h3>
              {cart.length > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                  {cart.length}
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <ShoppingCart size={32} className="text-gray-200" />
                <p className="text-center text-xs text-gray-400">
                  Agrega productos para completar la venta
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <CartItem
                    key={item.product.id}
                    item={item}
                    canApplyDiscount={canApplyDiscount}
                    onIncrease={increase}
                    onDecrease={decrease}
                    onRemove={removeFromCart}
                    onPriceChange={changePrice}
                  />
                ))}
              </div>
            )}
          </div>

          {canApplyDiscount && cart.length > 0 && (
            <DiscountSection
              subtotal={subtotal}
              discountType={discountType}
              setDiscountType={setDiscountType}
              discountValue={discountValue}
              setDiscountValue={setDiscountValue}
            />
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)..."
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {discountAmount > 0 && (
              <div className="mb-3 space-y-1 border-b border-gray-100 pb-3 text-sm">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-orange-600">
                  <span>Descuento</span>
                  <span>−{formatCurrency(discountAmount)}</span>
                </div>
              </div>
            )}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Total a cobrar</span>
              <span className="text-2xl font-extrabold text-gray-900">{formatCurrency(total)}</span>
            </div>

            {createSale.isError && (
              <p className="mb-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600 ring-1 ring-red-100">
                {createSale.error?.response?.data?.message ?? 'Error al registrar la venta'}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || createSale.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              {createSale.isPending && <Loader2 size={14} className="animate-spin" />}
              {createSale.isPending ? 'Registrando...' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">
                {cart.length} producto{cart.length !== 1 ? 's' : ''}
                {discountAmount > 0 && ` · −${formatCurrency(discountAmount)} desc.`}
              </p>
              <p className="text-lg font-extrabold text-gray-900 leading-none">
                {formatCurrency(total)}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={createSale.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              {createSale.isPending && <Loader2 size={13} className="animate-spin" />}
              {createSale.isPending ? 'Registrando...' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
