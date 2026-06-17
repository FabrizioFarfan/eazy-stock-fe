import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Trash2, Printer, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../hooks/useProducts'
import { useDebounce } from '../hooks/useDebounce'
import { productsApi } from '../services/endpoints/products'
import ScannerInput from '../components/ScannerInput'
import PriceInput from '../components/inputs/PriceInput'
import PriceInputModeToggle from '../components/inputs/PriceInputModeToggle'
import { formatPrice } from '../utils/formatMoney'
import { printQuote } from '../utils/printQuote'

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

export default function QuotePage() {
  const navigate = useNavigate()
  const { user, can } = useAuth()

  // Permiso: igual que registrar ventas (el owner puede dárselo al trabajador).
  useEffect(() => {
    if (user && !can('canRegisterSale')) navigate('/sales', { replace: true })
  }, [user, can, navigate])

  // ── Product search ──────────────────────────────────────────────────────────
  const [query, setQuery]       = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const debounced = useDebounce(query, 350)
  const scanLock  = useRef(false)

  const { data: prodData, isLoading: loadingProds } = useProducts(
    debounced ? { search: debounced, size: 8, active: true } : null,
    { enabled: !!debounced },
  )
  const results = prodData?.content ?? []

  // ── Cart ─────────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]) // [{ productId, name, sku, unit, qty, unitPrice }]

  const addProduct = (p) => {
    setItems((prev) => {
      if (prev.some((x) => x.productId === p.id)) return prev
      return [...prev, {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        qty: 1,
        unitPrice: p.priceIsVariable ? 0 : Number(p.salePrice) || 0,
      }]
    })
    setQuery('')
    setShowDrop(false)
  }

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((it) => (it.productId === id ? { ...it, ...patch } : it)))
  const removeItem = (id) =>
    setItems((prev) => prev.filter((it) => it.productId !== id))

  const handleScan = async (code) => {
    if (scanLock.current) return
    scanLock.current = true
    try {
      const product = (await productsApi.scanCode(code)).data.data
      addProduct(product)
    } catch {
      toast.error('No se encontró un producto con ese código')
    } finally {
      scanLock.current = false
    }
  }

  // ── Customer + meta ────────────────────────────────────────────────────────
  const [customerName, setCustomerName]   = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes]                 = useState('')
  const [validityDays, setValidityDays]   = useState(7)

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0),
    [items],
  )

  const handleGenerate = () => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto a la cotización')
      return
    }
    const ok = printQuote({
      businessName: user?.businessName,
      authorName: user?.name,
      customer: { name: customerName.trim(), phone: customerPhone.trim() },
      items,
      notes: notes.trim(),
      validityDays: Number(validityDays) || 0,
    })
    if (!ok) toast.error('Tu navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes.')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sales')}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Nueva cotización</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden text-[11px] text-gray-400 sm:inline">Formato del precio</span>
          <PriceInputModeToggle />
        </div>
      </div>

      <p className="-mt-2 text-sm text-gray-500">
        Arma un presupuesto para el cliente y genera un PDF para imprimir o enviar por WhatsApp /
        correo. No registra una venta ni descuenta stock.
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: products */}
        <div className="space-y-4 lg:col-span-2">
          {/* Search */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="relative">
              <ScannerInput
                value={query}
                onChange={(v) => { setQuery(v); setShowDrop(true) }}
                onScan={handleScan}
                placeholder="Buscar producto o escanear código..."
              />
              {showDrop && debounced && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-xl">
                  {loadingProds ? (
                    <p className="px-4 py-3 text-sm text-gray-400">Buscando...</p>
                  ) : results.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
                  ) : (
                    results.map((p) => (
                      <button key={p.id} type="button" onClick={() => addProduct(p)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
                        <span className="font-semibold text-gray-900">{p.name}</span>
                        <span className="ml-2 flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-xs text-gray-400">{p.sku}</span>
                          <span className="text-xs font-semibold text-gray-600">
                            {p.priceIsVariable ? 'Variable' : formatPrice(p.salePrice)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Package size={36} className="text-gray-200" />
                <p className="text-sm text-gray-400">Busca y agrega productos para cotizar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-widest text-gray-400">
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3 text-left">Precio unit.</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.productId} className="border-b border-gray-50 align-top">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{it.name}</p>
                          {it.sku && <p className="font-mono text-xs text-gray-400">{it.sku}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number" min="0" step="any"
                            value={it.qty}
                            onChange={(e) => updateItem(it.productId, { qty: e.target.value === '' ? '' : Number(e.target.value) })}
                            className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-44">
                            <PriceInput
                              value={it.unitPrice === '' ? null : it.unitPrice}
                              onChange={(v) => updateItem(it.productId, { unitPrice: v ?? 0 })}
                              maxDecimals={2}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {formatPrice((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeItem(it.productId)} title="Quitar"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: customer + meta + total */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">Datos del cliente (opcional)</h3>
            <div className="mt-3 space-y-3">
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente" className={inputCls} />
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Teléfono (opcional)" className={inputCls} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">Detalles</h3>
            <div className="mt-3 space-y-3">
              <label className="flex items-center justify-between gap-3 text-sm text-gray-600">
                <span>Validez (días)</span>
                <input type="number" min="0" value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="Notas (condiciones, entrega, etc.)" className={`${inputCls} resize-none`} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-semibold text-gray-600">Total</span>
              <span className="text-2xl font-extrabold text-gray-900">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={items.length === 0}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <Printer size={16} />
              Generar cotización (PDF)
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-gray-400">
              <FileText size={11} /> Se abre el diálogo de impresión — elige "Guardar como PDF" para enviarlo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
