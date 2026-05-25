import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

function formatCurrency(v) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v)
}

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-blue-600">Ingresos: {formatCurrency(payload[0]?.value)}</p>
      {payload[1] && <p className="text-indigo-500">Unidades: {payload[1].value}</p>}
    </div>
  )
}

export default function SalesByDayChart({ byDay, isLoading }) {
  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
  }

  if (!byDay?.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <p className="text-sm text-gray-400">Sin datos para el período seleccionado</p>
      </div>
    )
  }

  const data = byDay.map((d) => ({
    date: formatDay(d.date),
    revenue: Number(d.revenue),
    units: Number(d.units),
  }))

  // With fewer than 5 data points a bar chart reads better
  const useBar = data.length < 5

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h4 className="mb-4 text-sm font-semibold text-gray-700">Ingresos por día</h4>
      <ResponsiveContainer width="100%" height={240}>
        {useBar ? (
          <BarChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `S/ ${v}`} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} name="Ingresos" />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `S/ ${v}`} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f97316' }}
              activeDot={{ r: 5 }}
              name="Ingresos"
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
