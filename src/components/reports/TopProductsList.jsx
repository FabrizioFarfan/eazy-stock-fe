import { formatPrice } from '../../utils/formatMoney'
import { useT } from '../../i18n'

function formatCurrency(v) {
  return formatPrice(v) // moneda del negocio
}

function RankBadge({ position }) {
  if (position === 1)
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white">
        1
      </span>
    )
  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-mono text-xs font-semibold text-gray-500">
      {position}
    </span>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-6 w-6 animate-pulse rounded-full bg-gray-100" />
      <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
    </div>
  )
}

export default function TopProductsList({ topProducts, isLoading }) {
  const t = useT()
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">{t('Top 10 productos')}</h4>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    )
  }

  if (!topProducts?.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">{t('Top 10 productos')}</h4>
        <p className="py-4 text-center text-sm text-gray-400">{t('Sin datos')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">{t('Top 10 productos')}</h4>
      <ul className="divide-y divide-gray-100">
        {topProducts.map((p, i) => (
          <li key={p.productId} className="flex items-center gap-3 py-2.5">
            <RankBadge position={i + 1} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-800">{p.productName}</p>
              <p className="truncate font-mono text-[11px] text-gray-400">
                {t('Cód. proveedor')}: {p.providerCode || '—'}
              </p>
            </div>
            <span className="font-mono text-xs text-gray-500">{p.units} {t('u.')}</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(p.revenue)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
