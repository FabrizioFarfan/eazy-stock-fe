import { useEffect, useState } from 'react'
import { X, Download, QrCode, Barcode } from 'lucide-react'
import { productsApi } from '../../services/endpoints/products'

const TABS = [
  { id: 'qr',      label: 'Código QR',      icon: QrCode,  fetch: (id) => productsApi.getQr(id),      suffix: '-qr'      },
  { id: 'barcode', label: 'Código de barras', icon: Barcode, fetch: (id) => productsApi.getBarcode(id), suffix: '-barcode' },
]

function CodeImage({ product, tab }) {
  const [url,     setUrl]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    if (!product) return
    let objectUrl
    setLoading(true)
    setError(false)
    setUrl(null)

    tab.fetch(product.id)
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data)
        setUrl(objectUrl)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [product, tab])

  if (loading) return <div className="h-48 w-full max-w-xs animate-pulse rounded-xl bg-gray-100" />
  if (error)   return <p className="text-sm text-red-500">No se pudo generar el código.</p>

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={url}
        alt={`${tab.label} ${product.sku}`}
        className={`rounded-xl border border-gray-200 bg-white ${
          tab.id === 'qr' ? 'h-52 w-52' : 'h-28 w-80'
        }`}
      />
      <a
        href={url}
        download={`${product.sku}${tab.suffix}.png`}
        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98]"
      >
        <Download size={14} />
        Descargar
      </a>
    </div>
  )
}

export default function QrModal({ product, onClose }) {
  const [activeTab, setActiveTab] = useState('qr')

  if (!product) return null

  const tab = TABS.find((t) => t.id === activeTab)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Códigos del producto</h3>
            <p className="text-sm text-gray-500">{product.name} · {product.sku}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 pt-3">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                  activeTab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-4 px-6 py-6">
          <CodeImage key={activeTab} product={product} tab={tab} />
          {activeTab === 'qr' && product.qrCodeSystem && (
            <p className="text-center text-xs text-gray-400">{product.qrCodeSystem}</p>
          )}
          {activeTab === 'barcode' && (
            <p className="text-center text-xs text-gray-400">
              Formato Code 128 · SKU: {product.sku}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
