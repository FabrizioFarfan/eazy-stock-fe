import { ShoppingCart, TrendingUp, Package, Receipt } from 'lucide-react'

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v)
}

function Card({ icon: Icon, label, value, colorCls }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${colorCls}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return <div className="h-[76px] animate-pulse rounded-xl bg-gray-100" />
}

export default function SummaryCards({ summary, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card
        icon={ShoppingCart}
        label="Total ventas"
        value={summary?.totalSales ?? 0}
        colorCls="bg-blue-500"
      />
      <Card
        icon={TrendingUp}
        label="Ingresos totales"
        value={formatCurrency(summary?.totalRevenue)}
        colorCls="bg-green-500"
      />
      <Card
        icon={Package}
        label="Unidades vendidas"
        value={summary?.totalUnits ?? 0}
        colorCls="bg-indigo-500"
      />
      <Card
        icon={Receipt}
        label="Ticket promedio"
        value={formatCurrency(summary?.ticketAvg)}
        colorCls="bg-blue-600"
      />
    </div>
  )
}
