import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { formatPrice, currencySymbol } from '../../utils/formatMoney'
import { useT } from '../../i18n'

/** Barras apiladas por tramo: mercadería (recepciones) + otros gastos. */
function CustomTooltip({ active, payload, label }) {
  const t = useT()
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + Number(p.value || 0), 0)
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>
      <p className="text-blue-600">{t('Mercadería')}: {formatPrice(payload.find((p) => p.dataKey === 'purchased')?.value ?? 0)}</p>
      <p className="text-amber-600">{t('Otros gastos')}: {formatPrice(payload.find((p) => p.dataKey === 'expenses')?.value ?? 0)}</p>
      <p className="mt-1 border-t border-gray-100 pt-1 font-bold text-gray-900">{t('Total')}: {formatPrice(total)}</p>
    </div>
  )
}

export default function PurchasesChart({ buckets, labelOf, isLoading }) {
  const t = useT()
  if (isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
  const data = (buckets ?? []).map((b) => ({ label: labelOf(b), purchased: Number(b.purchased), expenses: Number(b.expenses) }))
  const empty = data.every((d) => d.purchased === 0 && d.expenses === 0)
  if (!data.length || empty) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
        <p className="text-sm text-gray-400">{t('Sin compras ni gastos en el período')}</p>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">{t('Cuánto se fue, tramo a tramo')}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tickFormatter={(v) => `${currencySymbol()} ${v}`} tick={{ fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'purchased' ? t('Mercadería') : t('Otros gastos'))} />
          <Bar dataKey="purchased" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} />
          <Bar dataKey="expenses" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
