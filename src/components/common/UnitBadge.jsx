import { useT } from '../../i18n'

// Cómo se vende el producto (por unidad, metro, kilo…). William tiene productos
// con el MISMO nombre que solo se distinguen por esto, así que va visible en las
// tablas y no solo en el detalle.
const TONES = {
  unidad: 'bg-gray-100 text-gray-600 ring-gray-200',
  metro:  'bg-blue-50 text-blue-700 ring-blue-100',
  kilo:   'bg-amber-50 text-amber-700 ring-amber-100',
  litro:  'bg-cyan-50 text-cyan-700 ring-cyan-100',
}

function toneFor(unit) {
  const u = unit.toLowerCase()
  if (u.startsWith('unid') || u === 'und' || u === 'pza' || u.startsWith('pieza')) return TONES.unidad
  if (u.startsWith('metro') || u === 'm' || u === 'mt' || u === 'mts')               return TONES.metro
  if (u.startsWith('kilo') || u === 'kg' || u.startsWith('gramo') || u === 'g')     return TONES.kilo
  if (u.startsWith('litro') || u === 'l' || u === 'lt' || u === 'ml')               return TONES.litro
  return 'bg-purple-50 text-purple-700 ring-purple-100'
}

export default function UnitBadge({ unit, className = '' }) {
  const t = useT()
  const u = (unit || 'unidad').trim()
  return (
    <span
      title={t('Se vende por {unit}', { unit: u })}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold lowercase ring-1 ${toneFor(u)} ${className}`}
    >
      {u}
    </span>
  )
}
