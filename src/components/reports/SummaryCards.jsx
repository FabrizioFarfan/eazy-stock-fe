import { formatPrice } from '../../utils/formatMoney'
import { TrendingUp } from 'lucide-react'
import { ReportHero } from './ReportKit'
import { useT } from '../../i18n'

function formatCurrency(v) {
  if (v == null) return '—'
  return formatPrice(v) // moneda del negocio
}

export default function SummaryCards({ summary, isLoading }) {
  const t = useT()
  // Rediseño 29-sep: franja azul como el Dashboard (antes 4 tarjetas sueltas).
  return (
    <ReportHero icon={TrendingUp} label={t('Ingresos totales')} loading={isLoading}
      value={formatCurrency(summary?.totalRevenue ?? 0)}
      cells={[
        [t('Total ventas'), summary?.totalSales ?? 0],
        [t('Unidades vendidas'), summary?.totalUnits ?? 0],
        [t('Ticket promedio'), formatCurrency(summary?.ticketAvg ?? 0)],
      ]} />
  )
}
