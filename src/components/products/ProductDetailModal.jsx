import { X, Package, TrendingUp, TrendingDown, ArrowUpDown, QrCode, Tag, Truck, FolderOpen, AlertTriangle, Edit, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { stockApi } from '../../services/endpoints/stock'
import { formatPrice } from '../../utils/formatMoney'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</p>
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-xs font-medium text-right text-gray-800 ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function MovementTypeIcon({ type }) {
  if (type === 'SALE') return <TrendingDown size={13} className="text-red-400" />
  if (type === 'PURCHASE_ENTRY') return <TrendingUp size={13} className="text-emerald-500" />
  if (type === 'RETURN') return <TrendingUp size={13} className="text-purple-500" />
  return <ArrowUpDown size={13} className="text-blue-400" />
}

function MovementTypeBadge({ type }) {
  if (type === 'SALE')
    return <span className="text-xs font-semibold text-red-500">Venta</span>
  if (type === 'PURCHASE_ENTRY')
    return <span className="text-xs font-semibold text-emerald-600">Entrada</span>
  if (type === 'RETURN')
    return <span className="text-xs font-semibold text-purple-600">Devolución</span>
  return <span className="text-xs font-semibold text-blue-500">Ajuste</span>
}

/**
 * Detalle completo del producto. Si llegan los handlers opcionales
 * (onEdit / onShowQr / onDeactivate) se muestra la barra de acciones al
 * pie — las acciones viven acá, no en columnas de la tabla.
 */
export default function ProductDetailModal({ product, onClose, onEdit, onShowQr, onDeactivate }) {
  const { data: movementsData, isLoading: loadingMov } = useQuery({
    queryKey: ['stock-movements', 'product', product.id],
    queryFn: () => stockApi.getMovementsByProduct(product.id, { size: 5 })
      .then((r) => r.data.data),
    enabled: !!product.id,
  })
  const movements = movementsData?.content ?? []

  const attrs = product.attributes ?? {}
  const hasAttrs = Object.keys(attrs).length > 0

  const isLow = product.currentStock <= product.minStock

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Package size={22} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">{product.name}</h3>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{product.sku}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-5">

          {/* Low stock warning */}
          {isLow && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-100">
              <AlertTriangle size={15} />
              Stock bajo — {product.currentStock} unidades (mínimo {product.minStock})
            </div>
          )}

          {/* Identificación */}
          <Section title="Identificación">
            <Row label="Código (SKU)"     value={product.sku}          mono />
            <Row label="Código proveedor" value={product.providerCode} mono />
            <Row label="QR sistema"       value={product.qrCodeSystem} mono />
            <Row label="Unidad"           value={product.unit} />
            {product.presentation && (
              <Row label="Presentación"   value={product.presentation} />
            )}
          </Section>

          {/* Notas de importación — si hubo issues durante el bulk import */}
          {product.importNotes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                Notas de importación
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                {product.importNotes}
              </p>
            </div>
          )}

          {/* Comercial */}
          <Section title="Comercial">
            {product.description && (
              <div className="mb-2 pb-2 border-b border-gray-100">
                <p className="text-xs text-gray-600">{product.description}</p>
              </div>
            )}
            <div className="flex gap-2 mb-2">
              {product.categoryName && (
                <div className="flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  <FolderOpen size={11} />
                  {product.categoryName}
                </div>
              )}
              {product.brandName && (
                <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <Tag size={11} />
                  {product.brandName}
                </div>
              )}
              {product.supplierName && (
                <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  <Truck size={11} />
                  {product.supplierName}
                </div>
              )}
            </div>
            <Row label="P. compra" value={formatPrice(product.purchasePrice)} />
            <Row label="P. venta"  value={
              product.priceIsVariable ? (
                <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                  Variable
                </span>
              ) : formatPrice(product.salePrice)
            } />
            <Row label="Margen"    value={
              !product.priceIsVariable && product.purchasePrice && product.salePrice
                ? `${(((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100).toFixed(1)}%`
                : null
            } />
          </Section>

          {/* Stock */}
          <Section title="Stock">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-gray-500">Stock actual</span>
              <span className={`text-lg font-bold ${isLow ? 'text-red-500' : 'text-emerald-600'}`}>
                {product.currentStock}
              </span>
            </div>
            <Row label="Stock mínimo" value={product.minStock} />
            <Row label="Estado"
              value={
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                  product.active
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                    : 'bg-gray-100 text-gray-500 ring-gray-200'
                }`}>
                  {product.active ? 'Activo' : 'Inactivo'}
                </span>
              }
            />
          </Section>

          {/* Atributos */}
          {hasAttrs && (
            <Section title="Atributos">
              {Object.entries(attrs).map(([key, val]) => (
                <Row key={key} label={key} value={val} />
              ))}
            </Section>
          )}

          {/* Historial reciente */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Historial reciente
            </p>
            {loadingMov ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5 text-center text-xs text-gray-400">
                Sin movimientos registrados
              </div>
            ) : (
              <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 bg-white">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                    <MovementTypeIcon type={m.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <MovementTypeBadge type={m.type} />
                        <span className="text-xs text-gray-400 truncate">{m.notes}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${
                      m.type === 'SALE' ? 'text-red-500' : 'text-emerald-600'
                    }`}>
                      {m.type === 'SALE' ? '-' : '+'}{m.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex gap-4 text-xs text-gray-400 pt-1">
            <span>Creado: {formatDate(product.createdAt)}</span>
            <span>·</span>
            <span>Actualizado: {formatDate(product.updatedAt)}</span>
          </div>
        </div>

        {/* Acciones */}
        {(onEdit || onShowQr || onDeactivate) && (
          <div className="flex flex-shrink-0 flex-wrap justify-end gap-2 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
            {onDeactivate && product.active && (
              <button
                onClick={() => onDeactivate(product)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Desactivar
              </button>
            )}
            {onShowQr && (
              <button
                onClick={() => onShowQr(product)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <QrCode size={14} />
                Código QR
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(product)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Edit size={14} />
                Editar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
