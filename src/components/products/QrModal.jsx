import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { productsApi } from '../../services/endpoints/products'

export default function QrModal({ product, onClose }) {
  const [qrUrl, setQrUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!product) return
    let objectUrl
    setLoading(true)
    setError(false)

    productsApi
      .getQr(product.id)
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data)
        setQrUrl(objectUrl)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [product])

  if (!product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Código QR</h3>
            <p className="text-sm text-gray-500">{product.name} · {product.sku}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-4 px-6 py-6">
          {loading && (
            <div className="h-56 w-56 animate-pulse rounded-lg bg-gray-100" />
          )}
          {error && (
            <p className="text-sm text-red-500">No se pudo cargar el código QR.</p>
          )}
          {qrUrl && !loading && (
            <img
              src={qrUrl}
              alt={`QR ${product.sku}`}
              className="h-56 w-56 rounded-lg border border-gray-200"
            />
          )}
          <p className="text-center text-xs text-gray-400">{product.qrCodeSystem}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cerrar
          </button>
          {qrUrl && (
            <a
              href={qrUrl}
              download={`${product.sku}.png`}
              className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              <Download size={14} />
              Descargar
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
