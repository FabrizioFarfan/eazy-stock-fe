import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, X, ShoppingCart, Loader2, Check, ArrowLeft } from 'lucide-react'
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
    <div className={`rounded-2xl border bg-white p-4 transition-all ${
      inCart ? 'border-orange-200 shadow-sm shadow-orange-100/80' : 'border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{product.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-500">
              {product.sku}
            </span>
            {(product.brandName || product.supplierName) && (
              <span className="text-xs text-gray-400 truncate">
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
          <button disabled
            className="flex items-center gap-1.5 rounded-xl border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">
            <Check size={12} />En carrito
          </button>
        ) : noStock ? (
          <button disabled
            className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed">
            Sin stock
          </button>
        ) : (
          <button onClick={() => onAdd(product)}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/30 hover:bg-orange-600 transition-all active:scale-[0.95]">
            <Plus size={12} />Agregar
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
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{product.name}</p>
        <button onClick={() => onRemove(product.id)}
          className="flex-shrink-0 rounded-lg p-0.5 text-gray-300 hover:bg-white hover:text-gray-500 transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button onClick={() => onDecrease(product.id)} disabled={quantity === 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Minus size={11} />
          </button>
          <span className="w-7 text-center text-sm font-bold text-gray-900">{quantity}</span>
          <button onClick={() => onIncrease(product.id)} disabled={quantity >= product.currentStock}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Plus size={11} />
          </button>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">{formatCurrency(product.salePrice)} × {quantity}</p>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(subtotal)}</p>
        </div>
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function NewSalePage() {
  const navigate    = useNavigate()
  const createSale  = useCreateSale()

  const [search, setSearch] = useState('')
  const debouncedSearch     = useDebounce(search, 400)

  const [cart, setCart]   = useState([])
  const [notes, setNotes] = useState('')

  const { data: productsData, isLoading: loadingProducts } = useProducts(
    debouncedSearch ? { search: debouncedSearch, size: 10, active: true } : null,
    { enabled: !!debouncedSearch },
  )
  const searchResults = productsData?.content ?? []
  const cartIds       = new Set(cart.map((i) => i.product.id))

  const addToCart = (product) => setCart((prev) => [...prev, { product, quantity: 1 }])
  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.product.id !== productId))
  const increase = (productId) => setCart((prev) =>
    prev.map((i) => i.product.id === productId
      ? { ...i, quantity: Math.min(i.quantity + 1, i.product.currentStock) }
      : i))
  const decrease = (productId) => setCart((prev) =>
    prev.map((i) => i.product.id === productId
      ? { ...i, quantity: Math.max(1, i.quantity - 1) }
      : i))

  const scanCode = async (code) => {
    try {
      const product = (await productsApi.scanCode(code)).data.data
      if (!product) { toast.error('Producto no encontrado'); return }
      if (product.currentStock === 0) { toast.warning('Sin stock disponible'); return }
      if (cartIds.has(product.id)) { increase(product.id); toast.info('Cantidad actualizada'); return }
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
    } catch { /* error shown via createSale.isError */ }
  }

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Nueva venta</h2>
        <button onClick={() => navigate('/sales')}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={14} />
          Volver
        </button>
      </div>

      <div className="flex flex-1 gap-5 overflow-hidden">
        {/* LEFT: product search */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          <ScannerInput
            value={search}
            onChange={setSearch}
            onScan={scanCode}
            placeholder="Buscar por nombre, SKU o escanear código..."
          />

          <div className="flex-1 overflow-y-auto pr-1">
            {!debouncedSearch ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <ShoppingCart size={28} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">Busca un producto o escanea su código</p>
                <p className="text-xs text-gray-400">Escribe el nombre, SKU o usa el lector de códigos</p>
              </div>
            ) : loadingProducts ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
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
        </div>

        {/* RIGHT: cart */}
        <div className="flex w-80 flex-shrink-0 flex-col gap-3">
          <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Carrito</h3>
              {cart.length > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
                  {cart.length}
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <ShoppingCart size={32} className="text-gray-200" />
                <p className="text-center text-xs text-gray-400">
                  Agrega productos para completar la venta
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <CartItem key={item.product.id} item={item}
                    onIncrease={increase} onDecrease={decrease} onRemove={removeFromCart} />
                ))}
              </div>
            )}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)..."
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder-gray-400"
          />

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-sm shadow-orange-500/30 hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {createSale.isPending && <Loader2 size={14} className="animate-spin" />}
              {createSale.isPending ? 'Registrando...' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
