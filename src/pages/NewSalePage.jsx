import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, X, ShoppingCart, Loader2, Check, ArrowLeft, Search, Tag, User, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../hooks/useProducts'
import { useCreateSale } from '../hooks/useSales'
import { useCustomers } from '../hooks/useCustomers'
import { useDebounce } from '../hooks/useDebounce'
import { productsApi } from '../services/endpoints/products'
import ScannerInput from '../components/ScannerInput'
import PriceInput from '../components/inputs/PriceInput'
import { formatPrice } from '../utils/formatMoney'

// Aggregate amounts (sale totals, discount totals) come back rounded to 2
// decimals from the BE — `formatPrice` falls through to the same formatting.
const formatCurrency = formatPrice

// Parse a user-entered numeric string into a number, treating empty/invalid as 0.
function parseNumber(s) {
  if (s == null || s === '') return 0
  if (typeof s === 'number') return Number.isFinite(s) ? s : 0
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
          {product.presentation && (
            <p className="truncate text-xs text-gray-400">{product.presentation}</p>
          )}
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
          {product.priceIsVariable ? (
            <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
              Precio variable
            </span>
          ) : (
            <p className="text-base font-bold text-gray-900">{formatCurrency(product.salePrice)}</p>
          )}
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
  const isVariable   = !!product.priceIsVariable
  const numericPrice = parseNumber(unitPrice)
  const subtotal     = quantity * numericPrice
  const isModified   = !isVariable && Math.abs(numericPrice - Number(product.salePrice ?? 0)) > 0.0000005
  const variableMissing = isVariable && (unitPrice === '' || unitPrice == null || numericPrice <= 0)

  // Si es variable, el input de precio está habilitado siempre (no es un override:
  // es el único precio). Autofoco al montar para que el cajero lo defina rápido.
  const priceInputDisabled = isVariable ? false : !canApplyDiscount

  return (
    <div className={`rounded-xl border p-3 ${
      variableMissing
        ? 'border-orange-300 bg-orange-50/70 ring-1 ring-orange-200'
        : 'border-gray-100 bg-gray-50/60'
    }`}>
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

        <p className="text-sm font-bold text-gray-900">{formatPrice(subtotal)}</p>
      </div>

      <div className="mt-2">
        <PriceInput
          value={isVariable && (unitPrice === '' || unitPrice == null) ? null : numericPrice}
          onChange={(v) => onPriceChange(product.id, v)}
          disabled={priceInputDisabled}
          maxDecimals={6}
          autoFocus={isVariable && variableMissing}
          placeholderWhole={isVariable ? 'Definir' : '0'}
          placeholderDecimals={isVariable ? '00' : '00'}
        />
        {isVariable ? (
          variableMissing ? (
            <p className="mt-1 text-[11px] font-medium text-orange-700">
              Este producto tiene precio variable — definir antes de cobrar
            </p>
          ) : (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
              <Tag size={10} />Precio definido en la venta
            </span>
          )
        ) : !canApplyDiscount ? (
          <p className="mt-1 text-[10px] text-gray-400">
            Tu administrador no te ha autorizado a modificar precios
          </p>
        ) : isModified ? (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
            <Tag size={10} />Precio modificado
          </span>
        ) : null}
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

// ── CreditSection — vender al fiado ───────────────────────────────────────────

function CustomerPicker({ value, onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const debounced = useDebounce(query, 350)

  const { data, isLoading } = useCustomers(
    debounced ? { search: debounced, size: 8 } : null,
    { enabled: !!debounced },
  )
  const results = data?.content ?? []

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-blue-900">{value.name}</p>
          <p className="truncate text-xs text-blue-700">
            {[value.documentId, value.phone].filter(Boolean).join(' · ') || 'Cliente seleccionado'}
          </p>
        </div>
        <button type="button"
          onClick={() => onSelect(null)}
          className="flex-shrink-0 rounded-lg p-1 text-blue-600 hover:bg-blue-100">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        placeholder="Buscar cliente por nombre, documento o teléfono..."
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
      />
      {open && debounced && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-xl">
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-gray-400">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
          ) : (
            results.map((c) => (
              <button key={c.id} type="button"
                onClick={() => { onSelect(c); setQuery(''); setOpen(false) }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{c.name}</p>
                  <p className="truncate text-xs text-gray-400">{[c.documentId, c.phone].filter(Boolean).join(' · ')}</p>
                </div>
                <span className="ml-2 flex-shrink-0 text-xs font-mono text-gray-500">
                  {formatPrice(c.currentDebt)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function CreditSection({ enabled, onToggle, customer, onSelectCustomer, total }) {
  const debt   = customer ? Number(customer.currentDebt ?? 0) : 0
  const limit  = customer && customer.creditLimit != null ? Number(customer.creditLimit) : null
  const noCredit  = customer && (limit == null || limit <= 0)
  const projected = debt + total
  const exceeds   = limit != null && limit > 0 && projected > limit

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <User size={14} className="text-blue-600" />
          Vender al fiado
        </span>
        <span className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} className="sr-only" />
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 mt-0.5 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </span>
      </label>

      {enabled && (
        <div className="mt-3 space-y-3">
          <CustomerPicker value={customer} onSelect={onSelectCustomer} />

          {customer && (
            <>
              {noCredit ? (
                <p className="rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-700 ring-1 ring-orange-100">
                  Este cliente no tiene crédito habilitado. Editá su ficha para
                  habilitarlo o vendé al contado.
                </p>
              ) : (
                <div className="space-y-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Deuda actual</span>
                    <span className="font-mono">{formatPrice(debt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Límite</span>
                    <span className="font-mono">{formatPrice(limit)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-gray-900">
                    <span>Después de esta venta</span>
                    <span className="font-mono">{formatPrice(projected)}</span>
                  </div>
                </div>
              )}

              {exceeds && (
                <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-100">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  Esta venta dejaría al cliente con {formatPrice(projected)} de deuda,
                  excediendo su límite de {formatPrice(limit)}. Podés continuar igual.
                </p>
              )}
            </>
          )}
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
  const canSellOnCredit  = can('canSellOnCredit')

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
  const [onCredit, setOnCredit]           = useState(false)
  const [customer, setCustomer]           = useState(null)

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
      {
        product,
        quantity: 1,
        // Precio variable arranca vacío para forzar al cajero a definirlo
        unitPrice: product.priceIsVariable ? '' : Number(product.salePrice ?? 0),
      },
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

  const isFiado = canSellOnCredit && onCredit
  const fiadoMissingCustomer = isFiado && !customer
  const fiadoCustomerNoCredit = isFiado && customer && (
    customer.creditLimit == null || Number(customer.creditLimit) <= 0
  )

  // Productos variables sin precio definido — bloquean la confirmación
  const variableWithoutPrice = cart.filter((i) =>
    i.product.priceIsVariable && parseNumber(i.unitPrice) <= 0,
  )
  const hasVariableWithoutPrice = variableWithoutPrice.length > 0

  const handleSubmit = async () => {
    if (cart.length === 0) return
    if (hasVariableWithoutPrice) {
      toast.error('Definí el precio de los productos variables antes de cobrar')
      return
    }
    if (fiadoMissingCustomer) {
      toast.error('Seleccioná un cliente para la venta al fiado')
      return
    }
    if (fiadoCustomerNoCredit) {
      toast.error('El cliente no tiene crédito habilitado')
      return
    }
    try {
      const items = cart.map((i) => {
        const enteredPrice = parseNumber(i.unitPrice)
        const original     = Number(i.product.salePrice ?? 0)
        // Para precio variable, el override SIEMPRE viaja — es el único precio.
        // Para precio fijo, sólo si el cajero lo cambió y tiene permiso.
        const overrideUsed = i.product.priceIsVariable
          || (canApplyDiscount && Math.abs(enteredPrice - original) > 0.0001)
        return {
          productId: i.product.id,
          quantity: i.quantity,
          ...(overrideUsed && { unitPriceOverride: enteredPrice }),
        }
      })

      const includeTotalDiscount = canApplyDiscount && numericDiscount > 0
      const sale = await createSale.mutateAsync({
        items,
        ...(notes.trim() && { notes: notes.trim() }),
        ...(includeTotalDiscount && {
          discountType,
          discountValue: numericDiscount,
        }),
        ...(isFiado && {
          isOnCredit: true,
          customerId: customer.id,
        }),
      })

      if (sale?.onCredit && sale?.customerName) {
        toast.success(
          `Venta al fiado registrada. ${sale.customerName} ahora debe ${formatPrice(sale.customerDebtAfter)}`,
          sale.exceedsCreditLimit
            ? { description: 'Excede el límite de crédito configurado.' }
            : undefined,
        )
      }
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

          {canSellOnCredit && cart.length > 0 && (
            <CreditSection
              enabled={onCredit}
              onToggle={(v) => { setOnCredit(v); if (!v) setCustomer(null) }}
              customer={customer}
              onSelectCustomer={setCustomer}
              total={total}
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
              disabled={cart.length === 0 || createSale.isPending || hasVariableWithoutPrice}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              {createSale.isPending && <Loader2 size={14} className="animate-spin" />}
              {createSale.isPending
                ? 'Registrando...'
                : isFiado ? 'Confirmar venta al fiado' : 'Confirmar venta'}
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
              disabled={createSale.isPending || hasVariableWithoutPrice}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              {createSale.isPending && <Loader2 size={13} className="animate-spin" />}
              {createSale.isPending
                ? 'Registrando...'
                : isFiado ? 'Confirmar venta al fiado' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
