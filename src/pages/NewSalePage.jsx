import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, X, ShoppingCart, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useProducts } from '../hooks/useProducts'
import { useCreateSale } from '../hooks/useSales'
import { useDebounce } from '../hooks/useDebounce'
import { productsApi } from '../services/endpoints/products'
import ScannerInput from '../components/ScannerInput'

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

// ── ProductCard ───────────────────────────────────────────────────────────────

function ProductCard({ product, inCart, onAdd }) {
  const noStock = product.currentStock === 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-orange-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-gray-900 truncate">{product.name}</span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              {product.sku}
            </span>
          </div>
          {(product.brand || product.providerName) && (
            <p className="mt-0.5 text-xs text-gray-500 truncate">
              {[product.brand, product.providerName].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500">
            Stock: <span className={noStock ? 'font-semibold text-red-500' : 'font-semibold text-gray-700'}>
              {product.currentStock} uds.
            </span>
          </p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.salePrice)}</p>
        </div>

        {inCart ? (
          <button
            disabled
            className="flex items-center gap-1.5 rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-600"
          >
            <Check size={12} />
            En carrito
          </button>
        ) : noStock ? (
          <button
            disabled
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed"
          >
            Sin stock
          </button>
        ) : (
          <button
            onClick={() => onAdd(product)}
            className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={12} />
            Agregar
          </button>
        )}
      </div>
    </div>
  )
}

// ── CartItem ──────────────────────────────────────────────────────────────────

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const { product, quantity } = item
  const subtotal = quantity * (product.salePrice ?? 0)

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">{product.name}</p>
        <button
          onClick={() => onRemove(product.id)}
          className="flex-shrink-0 rounded p-0.5 text-gray-300 hover:bg-gray-100 hover:text-gray-500"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDecrease(product.id)}
            disabled={quantity === 1}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <Minus size={12} />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-gray-900">{quantity}</span>
          <button
            onClick={() => onIncrease(product.id)}
            disabled={quantity >= product.currentStock}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-right">
          <p className="text-xs text-gray-400">
            {formatCurrency(product.salePrice)} × {quantity}
          </p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(subtotal)}</p>
        </div>
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function NewSalePage() {
  const navigate = useNavigate()
  const createSale = useCreateSale()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const [cart, setCart] = useState([]) // [{ product, quantity }]
  const [notes, setNotes] = useState('')

  const { data: productsData, isLoading: loadingProducts } = useProducts(
    debouncedSearch
      ? { search: debouncedSearch, size: 10, active: true }
      : null,
    { enabled: !!debouncedSearch }
  )
  const searchResults = productsData?.content ?? []
  const cartIds = new Set(cart.map((i) => i.product.id))

  // Cart handlers
  const addToCart = (product) => {
    setCart((prev) => [...prev, { product, quantity: 1 }])
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  const increase = (productId) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.min(i.quantity + 1, i.product.currentStock) }
          : i
      )
    )
  }

  const decrease = (productId) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.max(1, i.quantity - 1) }
          : i
      )
    )
  }

  const scanCode = async (code) => {
    try {
      const product = (await productsApi.scanCode(code)).data.data
      if (!product) {
        toast.error('Producto no encontrado')
        return
      }
      if (product.currentStock === 0) {
        toast.warning('Sin stock disponible')
        return
      }
      if (cartIds.has(product.id)) {
        increase(product.id)
        toast.info('Cantidad actualizada')
        return
      }
      addToCart(product)
      toast.success(product.name)
    } catch {
      toast.error('Producto no encontrado')
    }
  }

  const total = cart.reduce((sum, i) => sum + i.quantity * (i.product.salePrice ?? 0), 0)

  const handleSubmit = async () => {
    if (cart.length === 0) return
    try {
      await createSale.mutateAsync({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        ...(notes.trim() && { notes: notes.trim() }),
      })
      navigate('/sales')
    } catch {
      // error displayed via createSale.isError
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Nueva venta</h2>
        <button
          onClick={() => navigate('/sales')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a ventas
        </button>
      </div>

      <div className="flex flex-1 gap-5 overflow-hidden">
        {/* ── LEFT: product search ── */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          <ScannerInput
            value={search}
            onChange={setSearch}
            onScan={scanCode}
            placeholder="Buscar por nombre, SKU o escanear código..."
          />

          <div className="flex-1 overflow-y-auto">
            {!debouncedSearch ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <ShoppingCart size={36} className="text-gray-200" />
                <p className="text-sm text-gray-400">Busca un producto o escanea su código</p>
              </div>
            ) : loadingProducts ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16">
                <p className="text-sm text-gray-400">Sin resultados para "{debouncedSearch}"</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {searchResults.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    inCart={cartIds.has(p.id)}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: cart ── */}
        <div className="flex w-80 flex-shrink-0 flex-col gap-3">
          <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Resumen de venta</h3>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <ShoppingCart size={36} className="text-gray-200" />
                <p className="text-center text-sm text-gray-400">
                  Agrega productos para completar la venta
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cart.map((item) => (
                  <CartItem
                    key={item.product.id}
                    item={item}
                    onIncrease={increase}
                    onDecrease={decrease}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)..."
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder-gray-400"
          />

          {/* Total + submit */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
            </div>

            {createSale.isError && (
              <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {createSale.error?.response?.data?.message ?? 'Error al registrar la venta'}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || createSale.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {createSale.isPending && <Loader2 size={14} className="animate-spin" />}
              {createSale.isPending ? 'Registrando...' : 'Registrar venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
